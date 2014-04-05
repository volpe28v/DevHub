var LOGIN_COLOR_MAX = 9;

function ChatController(param){
  this.socket = param.socket;
  this.faviconNumber = param.faviconNumber;
  this.changedLoginName = param.changedLoginName;

  // Models
  this.loginElemList = [];

  // initialize
  this.init_chat();
  this.init_notification();
  this.init_socket();
  this.init_dropzone();
}

ChatController.prototype = {
  init_chat: function(){
    var that = this;

    $('#message').textcomplete([
      {
        //match: /\B:([\-+\w]*)$/,
        match: /\B:([\-+\w]*)$/,
        search: function (term, callback) {
            callback($.map(emojies, function (emoji) {
                return emoji.indexOf(term) === 0 ? emoji : null;
            }));
        },
        template: function (value) {
            return '<img class="emoji-suggest" src="img/emoji/' + value + '.png"></img> ' + value;
        },
        replace: function (value) {
            return ':' + value + ': ';
        },
        index: 1,
        maxCount: 8
      }
    ]);

    // ログインリストのバインディング
    $.templates("#loginNameTmpl").link("#login_list_body", that.loginElemList);

    $('#list').on('click', '.remove_msg', function(){
      var id = "#" + $(this).closest('li').attr('id');
      var data_id = $(this).closest('li').data('id');
      $(id).fadeOut();
      that.send_remove_msg(data_id);
    });

    $('#chat_area').on('click', '.login-elem', function(){
      var name = $(this).children(".name").text();
      $('#message').val($('#message').val() + " @" + name + "さん ");
      $('#message').focus();
    });

    $('#form').submit(function() {
      var name = $('#name').val();
      var message = $('#message').val();

      if ( message && name ){
        that.socket.emit('message', {name:name, msg:message});
        $('#message').attr('value', '');

        if (that.login_name != name){
          that.login_name = name;
          that.changedLoginName(name);
        }
      }
      return false;
    });

    $('#pomo').click(function(){
      var name = $('#name').val();

      if (name){
        $('#message').attr('value', '');
        that.socket.emit('pomo', {name: name, msg: ''});

        if (that.login_name != name){
          that.login_name = name;
          that.changedLoginName(name);
        }
      }
      return false;
    });

    // アップロードボタン
    $('#upload_chat_button').click(function(){
      $('#upload_chat').click();
      return false;
    });

    emojify.setConfig({
      img_dir          : 'img/emoji',  // Directory for emoji images
    });
  },

  setName: function(name){
    this.login_name = name;
    $('#name').val(name);
    this.changedLoginName(name);
  },

  focus: function(){
    $('#message').focus();
  },

  setWidth: function(width){
    $('#chat_area').css('width',width + 'px').css('margin',0);
  },

  init_socket: function(){
    var that = this;                    
    this.socket.on('message_own', function(data) {
      var $msg = that.prepend_own_msg(data);
      that.setColorbox($msg.find('.thumbnail'));
      emojify.run($msg.get(0));
      that.play_sound(data.msg);
      that.faviconNumber.up();
    });

    this.socket.on('message', function(data) {
      var $msg = that.prepend_msg(data);
      that.setColorbox($msg.find('.thumbnail'));
      emojify.run($msg.get(0));
      that.do_notification(data);
      that.play_sound(data.msg);
      that.faviconNumber.up();
    });

    this.socket.on('remove_message', function(data) {
      $('#msg_' + data.id).fadeOut();
    });

    this.socket.on('list', function(login_list) {
      $('#login_list_loader').hide();

      var login_elems = [];
      for (var i = 0; i < login_list.length; ++i){
        var place = "";
        if ( login_list[i].place != "" ){
          place = "@" + login_list[i].place;
        }

        login_elems.push({
          id: login_list[i].id,
          color_id: "login-elem login-name" + that.get_color_id_by_name_id(login_list[i].id),
          name: login_list[i].name,
          place: place,
          pomo_min: login_list[i].pomo_min
        });
      }
      $.observable(that.loginElemList).refresh(login_elems);
    });

    this.socket.on('latest_log', function(msgs) {
      for ( var i = 0 ; i < msgs.length; i++){
        that.append_msg(msgs[i])
      }

      that.setColorbox($('#chat_body').find('.thumbnail'));
      emojify.run($('#chat_body').get(0));
    });
  },

  init_dropzone: function(){
    this.dropZone = new DropZone({
      dropTarget: $('#chat_area'),
      fileTarget: $('#upload_chat'),
      alertTarget: $('#alert_chat_area'),
      uploadedAction: function(that, res){
        $('#message').val($('#message').val() + ' ' + res.fileName + ' ');
      }
    });
  },

  append_msg: function(data){
    //TODO: System メッセージを非表示にする。
    //      切り替え可能にするかは検討する。
    if (data.name == "System") { return };
    if (this.exist_msg(data)){ return };

    var msg = this.get_msg_html(data);

    $('#list').append(msg.li.addClass(msg.css));
    msg.li.fadeIn();
  },

  prepend_msg: function(data){
    //TODO: System メッセージを非表示にする。
    //      切り替え可能にするかは検討する。
    if (data.name == "System") { return }
    if (this.exist_msg(data)){ return };

    var msg = this.get_msg_html(data);

    $('#list').prepend(msg.li);
    msg.li.addClass("text-highlight",0);
    msg.li.slideDown('fast',function(){
      msg.li.switchClass("text-highlight", msg.css, 500);
    });

    return msg.li;
  },

  prepend_own_msg: function(data){
    if (this.exist_msg(data)){ return };
    var msg = this.get_msg_html(data);

    $('#list').prepend(msg.li);
    msg.li.addClass("text-highlight",0);
    msg.li.slideDown('fast',function(){
      msg.li.switchClass("text-highlight", msg.css, 500);
    });

    return msg.li;
  },

  exist_msg: function(data){
    if (data.msg == undefined) { data.msg = ""; }
    var id = '#msg_' + data._id.toString();
    return $(id).size() > 0;
  },

  get_msg_html: function(data){
    if ( data.name == this.login_name ){
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + '<a class="remove_msg">x</a><span class="own_msg_date">' + data.date + '</span></td></tr></table>'),
        css: "own_msg"
      };
    } else if (this.include_target_name(data.msg,this.login_name)){
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + ' <span class="target_msg_date">' + data.date + '</span></td></tr></table>'),
          css: "target_msg"
      };
    }else{
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + ' <span class="date">' + data.date + '</span></td></tr></table>'),
          css: "normal_msg"
      };
    }
  },

  get_msg_li_html: function(data){
    if ( data._id != undefined ){
      return $('<li/>').attr('style','display:none').attr('id','msg_' + data._id.toString()).attr('data-id', data._id.toString());
    }else{
      return $('<li/>').attr('style','display:none');
    }
  },

  get_msg_body: function(data){
    var date = new Date();
    var id = date.getTime();

    var name_class = "login-name";
    var msg_class = "msg";

    data.id = this.get_id(data.name)

    if ( data.name == "System" ){
      name_class = "login-name-system";
      msg_class = "msg_ext"
    }else if ( data.ext == true ){
      name_class = "login-name-ext";
      msg_class = "msg_ext"
    }else if ( data.name == "Pomo" ){
      name_class = "login-name-pomosys";
      msg_class = "msg_pomo"
    }else{
      name_class = "login-name" + this.get_color_id_by_name_id(data.id);
    }

    return '<table><tr><td nowrap valign="top"><span class="login-elem ' + name_class + '"><span class="name">' + data.name + '</span></span></td><td width="100%"><span class="msg_text ' + msg_class + '">' + this.decorate_msg(data.msg) + '</span>';
  },

  get_color_id_by_name_id: function(id){
    if(id == 0){ return 0; } // no exist user.
    return id % LOGIN_COLOR_MAX + 1; // return 1 〜 LOGIN_COLOR_MAX
  },

  decorate_msg: function(msg){
    var deco_msg = msg;

    deco_msg = this.deco_login_name(deco_msg)
    deco_msg = $.decora.message_to_html(deco_msg);

    return deco_msg;
  },

  deco_login_name: function(msg){
    var that = this;
    var deco_msg = msg;
    var name_reg = RegExp("@(.+?)さん", "g");
    deco_msg = deco_msg.replace( name_reg, function(){
      if (arguments[1] == that.login_name){
        //return '<span class="label label-important">' + arguments[0] + '</span>'
        return '<span class="target-me">' + arguments[0] + '</span>'
      }else{
        return '<span class="target-other">' + arguments[0] + '</span>'
      }
    });
    return deco_msg;
  },

  include_target_name: function(msg,name){
    var name_reg = RegExp("@" + name + "( |　|さん|$)");
    if (msg.match(name_reg)){
      return true;
    }
    return false;
  },

  get_id: function(name){
    for(var i = 0; i < this.loginElemList.length; ++i ){
      if ( this.loginElemList[i].name == name ){
        return this.loginElemList[i].id;
      }
    }
    return 0;
  },

  send_remove_msg: function(id){
    this.socket.emit('remove_message', {id:id});
  },

  setColorbox: function($dom){
    $dom.colorbox({
      transition: "none",
      rel: "img",
      maxWidth: "100%",
      maxHeight: "100%",
      initialWidth: "200px",
      initialHeight: "200px"
    });
  },

  play_sound: function(text){
    if(text.match(/play:(.+)/)){
      console.log(RegExp.$1);
      $.ionSound.destroy();
      $.ionSound({
            sounds: [
                RegExp.$1
            ],
            path: "/uploads/",
            volume: "0.5"
      });
      $.ionSound.play(RegExp.$1);
    }
  },

  init_notification: function(){
    if(window.localStorage){
      if(window.localStorage.popupNotification == 'true'){
        $('#notification').attr('checked', 'checked');
      }

      $('#notification').on('click', function(){
        if($(this).attr('checked') == 'checked'){
          window.localStorage.popupNotification = 'true';
          if (window.webkitNotifications){
            window.webkitNotifications.requestPermission();
          }else if(Notification){
            Notification.requestPermission();
          }
        }else{
          window.localStorage.popupNotification = 'false';
        }
      });

      if (window.localStorage.notificationSeconds){
        $('#notification_seconds').val(window.localStorage.notificationSeconds);
      }else{
        $('#notification_seconds').val(5);
        window.localStorage.notificationSeconds = 5;
      } 
      $('#notification_seconds').on('change',function(){
        window.localStorage.notificationSeconds = $(this).val();
      });
    }else{
      $('#notification').attr('disabled', 'disabled');
    }
  },

  do_notification: function(data){
    var notif_title = data.name + (TITLE_NAME != "" ? " @" + TITLE_NAME : "");
    var notif_icon = 'notification.png';
    var notif_msg = data.msg;

    if (window.localStorage.popupNotification == 'true'){
      if (window.webkitNotifications){
        var havePermission = window.webkitNotifications.checkPermission();
        if (havePermission == 0) {
          var notification = window.webkitNotifications.createNotification(
              notif_icon,
              notif_title,
              notif_msg
              );
          notification.onclick = function () {
            notification.close();
          }
          notification.show();
          setTimeout(function(){
            notification.cancel();
          }, window.localStorage.notificationSeconds * 1000);
        } else {
          window.webkitNotifications.requestPermission();
        }
      }else if(Notification){
        Notification.requestPermission(function(permission){
          if(Notification.permission == "granted"){
            switch(Notification.permission){
              case "granted":
              case "default":
                new Notification(notif_title, {
                  icon:notif_icon,
                    body:notif_msg,
                    tag:"notification-test",
                });
                break;
              case "denied":
                break;
            }
          }
        });
      }
    }
  }
}
