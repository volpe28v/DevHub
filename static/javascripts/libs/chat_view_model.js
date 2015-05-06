var LOGIN_COLOR_MAX = 9;

function ChatViewModel(param){
  this.no = param.no;
  this.socket = param.socket;
  this.getId = param.getId; // function
  this.getName = param.getName; // function
  this.getFilterName = param.getFilterName; // function
  this.getFilterWord = param.getFilterWord; // function
  this.upHidingCount = param.upHidingCount; // function
  this.faviconNumber = param.faviconNumber;
  this.room = "Room" + this.no;

  this.mentionCount = 0;
  this.unreadRoomCount = 0;
  this.unreadCount = 0;
  this.isActive = false;

  // socket.io event handler
  this.on_message_own = this._message_own_handler();
  this.on_message = this._message_handler();
  this.on_latest_log = this._latest_log_handler();
  this.on_room_name = this._room_name_handler();

  this.listId = "#list_" + this.no;
  this.initSocket();
}

ChatViewModel.prototype = {
  initSocket: function(){
    this.socket.on('message_own' + this.no, this.on_message_own);
    this.socket.on('message' + this.no, this.on_message);
    this.socket.on('latest_log' + this.no, this.on_latest_log);
    this.socket.on('room_name' + this.no, this.on_room_name);

    this.socket.emit('latest_log', {no: this.no});
    this.socket.emit('room_name', {no: this.no});
  },

  _msg_post_processing: function(data, $msg){
    var that = this;
    that.setColorbox($msg.find('.thumbnail'));
    emojify.run($msg.get(0));

    // リンク内の絵文字を有効化
    $msg.find('a').each(function(){
      emojify.run($(this).get(0));
    });

    that.play_sound(data.msg);
    $msg.find('span[rel=tooltip]').tooltip({placement: 'bottom'});
  },

  _message_own_handler: function(){
    var that = this;
    return function(data) {
      that.prepend_own_msg(data, function($msg){
        that._msg_post_processing(data, $msg);
      });
    }
  },

  _message_handler: function(){
    var that = this;
    return function(data) {
      that.prepend_msg(data,function($msg){
        that._msg_post_processing(data, $msg);
        that.do_notification(data);
        if (that.faviconNumber.up()){
          $msg.addClass("unread-msg");

          if (that.include_target_name(data.msg,that.getName())){
            $.observable(that).setProperty("mentionCount", that.mentionCount + 1);
          }else if (that.include_room_name(data.msg)){
            $.observable(that).setProperty("unreadRoomCount", that.unreadRoomCount + 1);
          }else{
            $.observable(that).setProperty("unreadCount", that.unreadCount + 1);
          }
        }
      });
    }
  },

  _latest_log_handler: function() {
    var that = this;
    return function(msgs){
      $('#message_loader').hide();
      if (msgs.length == 0){ return; }

      var add_count = 0;
      for ( var i = 0 ; i < msgs.length; i++){
        if (that.append_msg(msgs[i])){ add_count++; }
      }

      if (add_count > 0){
        var $chat_body = $(that.listId);
        that.setColorbox($chat_body.find('.thumbnail'));
        emojify.run($chat_body.get(0));

        // リンク内の絵文字を有効化
        $chat_body.find('a').each(function(){
          emojify.run($(this).get(0));
        });

        $(that.listId + ' span[rel=tooltip]').tooltip({placement: 'bottom'});
      }else{
        if (msgs.length == 1){ return; } // 1件の場合はもうデータなし
        that.load_log_more(msgs[msgs.length-1]._id);
      }
    }
  },

  _room_name_handler: function() {
    var that = this;
    return function(room_name){
      $.observable(that).setProperty("room", room_name);
    }
  },

  destroySocket: function(){
    this.socket.removeListener("message_own" + this.no, this.on_message_own);
    this.socket.removeListener("message" + this.no, this.on_message);
    this.socket.removeListener("latest_log" + this.no, this.on_latest_log);
    this.socket.removeListener('room_name' + this.no, this.on_room_name);
  },

  reloadTimeline: function(){
    this.clear_unread();
    $(this.listId).empty();
    this.socket.emit('latest_log', {no: this.no});
    $('#message_loader').show();
  },

  set_active: function(is_active){
    if (is_active){
      this.isActive = true;
    }else{
      this.isActive = false;
    }
  },

  load_log_more: function(id){
    $('#message_loader').show();
    this.socket.emit('load_log_more', {room_id: this.no, id: id});
  },

  clear_unread: function(){
    this.faviconNumber.minus(this.mentionCount + this.unreadCount + this.unreadRoomCount);
    $(this.listId).find('li').removeClass("unread-msg");
    $.observable(this).setProperty("mentionCount", 0);
    $.observable(this).setProperty("unreadRoomCount", 0);
    $.observable(this).setProperty("unreadCount", 0);
  },

  append_msg: function(data){
    //TODO: System メッセージを非表示にする。
    //      切り替え可能にするかは検討する。
    if (data.name == "System") { return false; };
    if (this.exist_msg(data)){ return false; };

    var msg = this.get_msg_html(data);

    if (this.display_message(msg)){
      $(this.listId).append(msg.li.addClass(msg.css));
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
      $(this.listId).prepend(msg.li);
      msg.li.addClass("text-highlight",0);
      msg.li.slideDown('fast',function(){
        msg.li.switchClass("text-highlight", msg.css, 500);
      });
      callback(msg.li);
      return true;
    }else{
      this.upHidingCount();
      return false;
    }
  },

  prepend_own_msg: function(data, callback){
    if (this.exist_msg(data)){ return false; }
    var msg = this.get_msg_html(data);

    $(this.listId).prepend(msg.li);
    if (this.display_message(msg)){
      msg.li.addClass("text-highlight",0);
      msg.li.slideDown('fast',function(){
        msg.li.switchClass("text-highlight", msg.css, 500);
      });
      callback(msg.li);
      return true;
    }else{
      this.upHidingCount();
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
    if ( data.name == this.getName()){
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + '<a class="remove_msg">x</a><span class="own_msg_date">' + disp_date + '</span></td></tr></table>'),
        css: "own_msg"
      };
    } else if (this.include_target_name(data.msg,this.getName())){
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + ' <span class="target_msg_date">' + disp_date + '</span></td></tr></table>'),
        css: "target_msg"
      };
    } else if (this.include_room_name(data.msg)){
      return {
        li: this.get_msg_li_html(data).html(this.get_msg_body(data) + ' <span class="room_msg_date">' + disp_date + '</span></td></tr></table>'),
        css: "room_msg"
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

    data.id = this.getId(data.name)

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
    var name_reg = RegExp("@([^ .]+?)さん|@all|@" + that.room, "g");
    deco_msg = deco_msg.replace( name_reg, function(){
      if (arguments[1] == that.getName()||
          arguments[0] == "@みなさん"     ||
          arguments[0] == "@all"){
        return '<span class="target-me">' + arguments[0] + '</span>'
      }else if (arguments[0] == "@" + that.room){
        return '<span class="target-room">' + arguments[0] + '</span>'
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

  include_room_name: function(msg){
    var room_reg = RegExp("@" + this.room + "( |　|さん|$)");
    if (msg.match(room_reg)){
      return true;
    }
    return false;
  },

  remove_msg: function(id){
    this.socket.emit('remove_message', {id:id});
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
    }else if (this.getFilterName() != ""){
      if (msg.li.find(".login-symbol").data("name") != this.getFilterName()){
        return false;
      }
    }

    if (this.getFilterWord() != ""){
      var reg = RegExp(this.getFilterWord());
      if (!msg.li.find(".msg").text().match(reg)){
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
        (window.localStorage.popupNotification == 'mention' && this.include_target_name(notif_msg, this.getName()))){
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

