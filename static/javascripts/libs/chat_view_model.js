var LOGIN_COLOR_MAX = 9;

function ChatViewModel(param){
  this.no = param.no;
  this.socket = param.socket;
  this.get_id = param.get_id; // function
  this.get_name = param.get_name; // function
  this.faviconNumber = param.faviconNumber;
  this.filterName = "";
  this.unreadCount = 0;
  this.active_class = "";

  this.list_id = "#list_" + this.no;
  this.initSocket();
}

ChatViewModel.prototype = {
  initSocket: function(){
    var that = this;

    function _msg_post_processing(data, $msg){
      that.setColorbox($msg.find('.thumbnail'));
      emojify.run($msg.get(0));

      // リンク内の絵文字を有効化
      $msg.find('a').each(function(){
        emojify.run($(this).get(0));
      });

      that.play_sound(data.msg);
      $msg.find('span[rel=tooltip]').tooltip({placement: 'bottom'});
    }

    this.socket.on('message_own' + this.no, function(data) {
      that.prepend_own_msg(data, function($msg){
        _msg_post_processing(data, $msg);
      });
    });

    this.socket.on('message' + this.no, function(data) {
      that.prepend_msg(data,function($msg){
        _msg_post_processing(data, $msg);
        that.do_notification(data);
        if (that.faviconNumber.up()){
          console.log(that.unreadCount);
          $msg.addClass("unread-msg");
          $.observable(that).setProperty("unreadCount", that.unreadCount + 1);
        }
      });
    });

    this.socket.on('latest_log' + this.no, function(msgs) {
      $('#message_loader').hide();
      if (msgs.length == 0){ return; }

      var add_count = 0;
      for ( var i = 0 ; i < msgs.length; i++){
        if (that.append_msg(msgs[i])){ add_count++; }
      }

      if (add_count > 0){
        var $chat_body = $(that.list_id);
        that.setColorbox($chat_body.find('.thumbnail'));
        emojify.run($chat_body.get(0));

        // リンク内の絵文字を有効化
        $chat_body.find('a').each(function(){
          emojify.run($(this).get(0));
        });

        $(that.list_id + ' span[rel=tooltip]').tooltip({placement: 'bottom'});
      }else{
        if (msgs.length == 1){ return; } // 1件の場合はもうデータなし
        that.load_log_more(msgs[msgs.length-1]._id);
      }
    });

    this.socket.emit('latest_log', {no: this.no});
  },

  set_active: function(is_active){
    if (is_active){
      this.active_class = "active";
    }else{
      this.active_class = "";
    }
  },

  load_log_more: function(id){
    $('#message_loader').show();
    this.socket.emit('load_log_more', {room_id: this.no, id: id});
  },

  clear_unread: function(){
    this.faviconNumber.minus(this.unreadCount);
    $(this.list_id).find('li').removeClass("unread-msg");
    $.observable(this).setProperty("unreadCount", 0);
  },

  append_msg: function(data){
    //TODO: System メッセージを非表示にする。
    //      切り替え可能にするかは検討する。
    if (data.name == "System") { return false; };
    if (this.exist_msg(data)){ return false; };

    var msg = this.get_msg_html(data);

    if (this.display_message(msg)){
      $(this.list_id).append(msg.li.addClass(msg.css));
      msg.li.fadeIn();
      return true;
    }
    return false;
  },

  prepend_msg: function(data, callback){
    //TODO: System メッセージを非表示にする。
    //      切り替え可能にするかは検討する。
    if (data.name == "System"){ return false; }
    if (this.exist_msg(data)){ return false; }

    var msg = this.get_msg_html(data);

    if (this.display_message(msg)){
      $(this.list_id).prepend(msg.li);
      msg.li.addClass("text-highlight",0);
      msg.li.slideDown('fast',function(){
        msg.li.switchClass("text-highlight", msg.css, 500);
      });
      callback(msg.li);
      return true;
    }else{
      $.observable(this).setProperty("hidingMessageCount", this.hidingMessageCount + 1);
      return false;
    }
  },

  prepend_own_msg: function(data, callback){
    if (this.exist_msg(data)){ return false; }
    var msg = this.get_msg_html(data);

    $(this.list_id).prepend(msg.li);
    if (this.display_message(msg)){
      msg.li.addClass("text-highlight",0);
      msg.li.slideDown('fast',function(){
        msg.li.switchClass("text-highlight", msg.css, 500);
      });
      callback(msg.li);
      return true;
    }else{
      $.observable(this).setProperty("hidingMessageCount", this.hidingMessageCount + 1);
      return false;
    }
  },

  exist_msg: function(data){
    if (data.msg == undefined) { data.msg = ""; }
    var id = '#msg_' + data._id.toString();
    return $(id).size() > 0;
  },

  get_msg_html: function(data){
    var disp_date = data.date.replace(/:\d\d$/,""); // 秒は削る
    if ( data.name == this.get_name()){
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + '<a class="remove_msg">x</a><span class="own_msg_date">' + disp_date + '</span></td></tr></table>'),
        css: "own_msg"
      };
    } else if (this.include_target_name(data.msg,this.get_name())){
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
      if (arguments[1] == that.get_name()||
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

  remove_msg: function(id){
    this.socket.emit('remove_message', {id:id});
    console.log(id);
    $("#msg_" + id).fadeOut('normal', function(){
      $(this).remove();
    });
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

  display_message: function(msg){
    if (window.localStorage.timeline == "own"){
      if (msg.css == 'normal_msg'){
        return false;
      }
    }else if (window.localStorage.timeline == "mention"){
      if (msg.css == 'normal_msg' || msg.css == 'own_msg'){
        return false;
      }
    }else if (this.filterName != ""){
      if (msg.li.find(".login-symbol").data("name") != this.filterName){
        return false;
      }
    }
    return true;
  },

  do_notification: function(data){
    var notif_title = data.name + (TITLE_NAME != "" ? " @" + TITLE_NAME : "");
    var notif_icon = 'notification.png';
    if (data.avatar != null && data.avatar != "" && data.avatar != "undefined"){
      notif_icon = data.avatar;
    }
    var notif_msg = data.msg;

    if (window.localStorage.popupNotification == 'true' ||
        (window.localStorage.popupNotification == 'mention' && this.include_target_name(notif_msg, this.get_name()))){
      if(Notification){
        if (Notification.permission != "denied"){
          var notification = new Notification(notif_title, {
            icon: notif_icon,
            body: notif_msg
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

