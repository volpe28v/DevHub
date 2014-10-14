var LOGIN_COLOR_MAX = 9;

function ChatController(param){
  this.socket = param.socket;
  this.faviconNumber = param.faviconNumber;
  this.changedLoginName = param.changedLoginName;
  this.showRefPoint = param.showRefPoint;

  // Models
  this.loginElemList = [];
  this.hidingMessageCount = 0;

  // initialize
  this.init_chat();
  this.init_settings();
  this.init_socket();
  this.init_dropzone();
}

ChatController.prototype = {
  setMessage: function(message){
    $('#message').val($('#message').val() + " " + message + " ");
    $('#message').focus();
  },

  init_chat: function(){
    var that = this;

    $('#message').textcomplete([
      {
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
    $.templates("#alertTimelineTmpl").link("#alert_timeline", that);

    $('#list').on('click', '.remove_msg', function(){
      var id = "#" + $(this).closest('li').attr('id');
      var data_id = $(this).closest('li').data('id');
      $(id).fadeOut();
      that.send_remove_msg(data_id);
    });

    $('#list').on('click', '.ref-point', function(){
      var id = $(this).attr("id");
      that.showRefPoint(id);
    });

    $('#chat_area').on('click', '.login-symbol', function(){
      var name = $(this).data("name");
      that.setMessage("@" + name + "さん");
    });

    $('#form').submit(function() {
      var name = $('#name').val();
      var message = $('#message').val();
      var avatar = window.localStorage.avatarImage;

      if ( message && name ){
        that.socket.emit('message', {name:name, avatar:avatar, msg:message});
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
      var avatar = window.localStorage.avatarImage;

      if (name){
        $('#message').attr('value', '');
        that.socket.emit('pomo', {name: name, avatar: avatar, msg: ''});

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

    // ログ追加読み込みイベント
    $("#list").on('inview', 'li:last-child', function(event, isInView, visiblePartX, visiblePartY) {
      if (!isInView){ return false; }

      $('#message_loader').show();

      var last_msg_id = $('#list').find('li').filter(':last').data("id");
      that.socket.emit('load_log_more', {id: last_msg_id});
    });

    emojify.setConfig({
      img_dir: 'img/emoji',  // Directory for emoji images
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

    function _msg_post_processing(data, $msg){
      that.setColorbox($msg.find('.thumbnail'));
      emojify.run($msg.get(0));
      that.play_sound(data.msg);
      that.faviconNumber.up();
      $msg.find('span[rel=tooltip]').tooltip({placement: 'bottom'});
    }

    this.socket.on('message_own', function(data) {
      var $msg = that.prepend_own_msg(data, function($msg){
        that.display_timeline($msg);
      });
      _msg_post_processing(data, $msg);
    });

    this.socket.on('message', function(data) {
      var $msg = that.prepend_msg(data,function($msg){
        that.display_timeline($msg);
      });
      _msg_post_processing(data, $msg);
      that.do_notification(data);
    });

    this.socket.on('remove_message', function(data) {
      $('#msg_' + data.id).fadeOut();
    });

    this.socket.on('list', function(login_list) {
      $('#login_list_loader').hide();
      $('#login_list_body span[rel=tooltip]').tooltip('hide');

      var login_elems = [];
      var avatar_elems = [];
      for (var i = 0; i < login_list.length; ++i){
        var place = "";
        if ( login_list[i].place != "" ){
          place = "@" + login_list[i].place;
        }

        var login_elem = {
            id: login_list[i].id,
            color_id: "login-symbol login-elem login-name" + that.get_color_id_by_name_id(login_list[i].id),
            name: login_list[i].name,
            avatar: login_list[i].avatar,
            place: place,
            pomo_min: login_list[i].pomo_min
          };
        if (login_list[i].avatar != undefined && login_list[i].avatar != ""){
          avatar_elems.push(login_elem);
        }else{
          login_elems.push(login_elem);
        }
      }
      $.observable(that.loginElemList).refresh(avatar_elems.concat(login_elems));
      $('#login_list_body span[rel=tooltip]').tooltip({placement: 'bottom'});
    });

    this.socket.on('latest_log', function(msgs) {
      $('#message_loader').hide();
      for ( var i = 0 ; i < msgs.length; i++){
        that.append_msg(msgs[i])
      }

      that.setColorbox($('#chat_body').find('.thumbnail'));
      emojify.run($('#chat_body').get(0));
      $('#chat_body span[rel=tooltip]').tooltip({placement: 'bottom'});

      that.display_timeline();
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

  prepend_msg: function(data, callback){
    //TODO: System メッセージを非表示にする。
    //      切り替え可能にするかは検討する。
    if (data.name == "System") { return }
    if (this.exist_msg(data)){ return };

    var msg = this.get_msg_html(data);

    $('#list').prepend(msg.li);
    msg.li.addClass("text-highlight",0);
    msg.li.slideDown('fast',function(){
      msg.li.switchClass("text-highlight", msg.css, 500, function(){
        callback(msg.li);
      });
    });

    return msg.li;
  },

  prepend_own_msg: function(data, callback){
    if (this.exist_msg(data)){ return };
    var msg = this.get_msg_html(data);

    $('#list').prepend(msg.li);
    msg.li.addClass("text-highlight",0);
    msg.li.slideDown('fast',function(){
      msg.li.switchClass("text-highlight", msg.css, 500, function(){
        callback(msg.li);
      });
    });

    return msg.li;
  },

  exist_msg: function(data){
    if (data.msg == undefined) { data.msg = ""; }
    var id = '#msg_' + data._id.toString();
    return $(id).size() > 0;
  },

  get_msg_html: function(data){
    var disp_date = data.date.replace(/:\d\d$/,""); // 秒は削る
    if ( data.name == this.login_name ){
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + '<a class="remove_msg">x</a><span class="own_msg_date">' + disp_date + '</span></td></tr></table>'),
        css: "own_msg"
      };
    } else if (this.include_target_name(data.msg,this.login_name)){
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + ' <span class="target_msg_date">' + disp_date + '</span></td></tr></table>'),
          css: "target_msg"
      };
    }else{
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + ' <span class="date">' + disp_date + '</span></td></tr></table>'),
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

    // avatar の undefined ガード処理が入る前のデータを弾くために文字列でも判定しておく
    if (data.avatar != null && data.avatar != "" && data.avatar != "undefined"){
      return '<table><tr><td nowrap valign="top" width="32px"><span class="login-symbol" data-name="' + data.name + '" title="' + data.name + '" rel="tooltip"><img class="avatar" src="' + data.avatar + '"></span></td><td width="100%"><span class="msg_text ' + msg_class + '">' + this.decorate_msg(data.msg) + '</span>';
    }else{
      return '<table><tr><td nowrap valign="top"><span class="login-symbol login-elem ' + name_class + '" data-name="' + data.name + '"><span class="name">' + data.name + '</span></span></td><td width="100%"><span class="msg_text ' + msg_class + '">' + this.decorate_msg(data.msg) + '</span>';
    }
  },

  get_color_id_by_name_id: function(id){
    if(id == 0){ return 0; } // no exist user.
    return id % LOGIN_COLOR_MAX + 1; // return 1 〜 LOGIN_COLOR_MAX
  },

  decorate_msg: function(msg){
    var deco_msg = msg;

    deco_msg = this.deco_login_name(deco_msg)
    deco_msg = $.decora.message_to_html(deco_msg);
    deco_msg = deco_msg.replace(/\n/g,"<br>");

    return deco_msg;
  },

  deco_login_name: function(msg){
    var that = this;
    var deco_msg = msg;
    var name_reg = RegExp("@([^ .]+?)さん|@all", "g");
    deco_msg = deco_msg.replace( name_reg, function(){
      if (arguments[1] == that.login_name ||
          arguments[0] == "@みなさん"     ||
          arguments[0] == "@all"){
        return '<span class="target-me">' + arguments[0] + '</span>'
      }else{
        return '<span class="target-other">' + arguments[0] + '</span>'
      }
    });
    return deco_msg;
  },

  include_target_name: function(msg,name){
    var name_reg = RegExp("@" + name + "( |　|さん|$)");
    if (msg.match(name_reg)    ||
        msg.match("@みなさん") ||
        msg.toLowerCase().match("@all")){
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
    if(text.match(/\/play (.+)/)){
      $.ionSound.destroy();
      var sound_name = RegExp.$1.split(".")[0];
      $.ionSound({
            sounds: [
               sound_name
            ],
            path: "/uploads/",
            volume: "0.5"
      });
      $.ionSound.play(sound_name);
    }
  },

  init_settings: function(){
    var that = this;
    if(window.localStorage){
      if(window.localStorage.popupNotification == 'true'){
        $('#notify_all').attr('checked', 'checked');
      }else if (window.localStorage.popupNotification == 'mention'){
        $('#notify_mention').attr('checked', 'checked');
      }

      $('.notify-radio').on('change', "input", function(){
        var mode = $(this).val();
        window.localStorage.popupNotification = mode; 
        if (mode != "disable"){
          if (window.webkitNotifications){
            window.webkitNotifications.requestPermission();
          }else if(Notification){
            Notification.requestPermission();
          }
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

      // for avatar
      if (window.localStorage.avatarImage){
        $('#avatar').val(window.localStorage.avatarImage);
      }

      $('#avatar_set').on('click',function(){
        window.localStorage.avatarImage = $('#avatar').val();

        var name = $('#name').val();
        that.socket.emit('name',
          {
            name:name,
            avatar: window.localStorage.avatarImage
          });
        return false;
      });

      // for Timeline
      if(window.localStorage.timeline == 'own'){
        $('#timeline_own').attr('checked', 'checked');
        $('#mention_own_alert').show();
      }else if (window.localStorage.timeline == 'mention'){
        $('#timeline_mention').attr('checked', 'checked');
        $('#mention_alert').show();
      }else{
        $('#timeline_all').attr('checked', 'checked');
      }

      $('.timeline-radio').on('change', "input", function(){
        var mode = $(this).val();
        window.localStorage.timeline = mode;
        if (mode == 'all'){
          $('.normal_msg').slideDown();
          $('.own_msg').slideDown();
          $('#mention_own_alert').slideUp();
          $('#mention_alert').slideUp();
        }else if (mode == 'own'){
          $('.normal_msg').slideUp();
          $('.own_msg').slideDown();
          $('#mention_own_alert').slideDown();
          $('#mention_alert').slideUp();
        }else{
          $('.normal_msg').slideUp();
          $('.own_msg').slideUp();
          $('#mention_own_alert').slideUp();
          $('#mention_alert').slideDown();
        }
        $.observable(that).setProperty("hidingMessageCount", 0);
      });

      $('#chat_body').on('click', '.close', function(){
        window.localStorage.timeline = 'all';
        $('.normal_msg').slideDown();
        $('.own_msg').slideDown();
        $('#mention_own_alert').slideUp();
        $('#mention_alert').slideUp();
        $('#timeline_all').attr('checked', 'checked');
        $(this).closest('.alert').slideUp();
        $.observable(that).setProperty("hidingMessageCount", 0);
        return false;
      });

   }else{
      $('#notification').attr('disabled', 'disabled');
    }
  },

  display_timeline: function($msg){
    if (window.localStorage.timeline == "own"){
      if ($msg != undefined && $msg.hasClass('normal_msg')){
        $.observable(this).setProperty("hidingMessageCount", this.hidingMessageCount + 1);
      }
      $('.normal_msg').slideUp();
    }else if (window.localStorage.timeline == "mention"){
      if ($msg != undefined && ($msg.hasClass('normal_msg') || $msg.hasClass('own_msg'))){
        $.observable(this).setProperty("hidingMessageCount", this.hidingMessageCount + 1);
      }
      $('.normal_msg').slideUp();
      $('.own_msg').slideUp();
    }
  },

  do_notification: function(data){
    var notif_title = data.name + (TITLE_NAME != "" ? " @" + TITLE_NAME : "");
    var notif_icon = 'notification.png';
    if (data.avatar != null && data.avatar != "" && data.avatar != "undefined"){
      notif_icon = data.avatar;
    }
    var notif_msg = data.msg;

    if (window.localStorage.popupNotification == 'true' ||
        (window.localStorage.popupNotification == 'mention' && this.include_target_name(notif_msg, this.login_name))){
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
        if (Notification.permission != "denied"){
          var notification = new Notification(notif_title, {
            icon: notif_icon,
            iconUrl: notif_icon,
            body: notif_msg,
            tag:"notification-test",
          });
          setTimeout(function(){
            notification.close();
          }, window.localStorage.notificationSeconds * 1000);
        }
      }else{
          Notification.requestPermission();
      }
    }
  }
}
