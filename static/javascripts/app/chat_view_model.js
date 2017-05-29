var LOGIN_COLOR_MAX = 9;

global.jQuery = require('jquery');
global.$ = global.jQuery;
require('jquery-ui');

var ko = require('knockout');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);
require('../libs/message_date');
require('sweetalert');

var emojify = require('emojify.js');
require('ion-sound');

function ChatViewModel(param){
  var that = this;

  this.no = param.no;
  this.room = ko.observable(param.room_name);
  this.socket = param.socket;
  this.parent = param.parent;
  this.showRefPoint = param.showRefPoint; // function

  // Models
  this.messages = ko.observableArray([]);
  this.mentionCount = ko.observable(0);
  this.unreadRoomCount = ko.observable(0);
  this.unreadCount = ko.observable(0);
  this.allUnreadCount = ko.pureComputed(function(){
    return that.mentionCount() + that.unreadCount() + that.unreadRoomCount();
  }).extend({ rateLimit: { method: "nofityWhenChangesStop", timeout: 200 }});
  this.allUnreadCount.subscribe(function(value){
    that.parent.updateFaviconNumber();
  });
  this.isActive = ko.observable(false);

  this.isLoadingLog = false;
  this.reloadAgain = false;

  // socket.io event handler
  this.on_message_own = this._message_own_handler();
  this.on_message = this._message_handler();
  this.on_latest_log = this._latest_log_handler();
  this.on_room_name = this._room_name_handler();

  this.listId = "#list_" + this.no;
  this.init();

  this.set_ref_point = function(element){
    var id = $(element).attr("id");
    that.showRefPoint(id);
    return true;
  }

  this.remove_msg = function(element){
    var this_msg = this;
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this message!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: true
    },function(){
      var data_id = $(element).closest('li').data('id');

      that.socket.emit('remove_message', {id: data_id});
      $("#msg_" + data_id).fadeOut('normal', function(){
        $(this).remove();
        that.messages.remove(this_msg);
      });
    });

    return true;
  }
}

ChatViewModel.prototype = {
  init: function(){
    this.socket.on('message_own' + this.no, this.on_message_own);
    this.socket.on('message' + this.no, this.on_message);
    this.socket.on('latest_log' + this.no, this.on_latest_log);
    this.socket.on('room_name' + this.no, this.on_room_name);

    this.isLoadingLog = true;
    this.socket.emit('latest_log', {room_id: this.no});
  },

  focusOrClearUnread: function(){
    var that = this;
    if (that.isActive()){
      that.clear_unread();
    }else{
      $('#chat_tab_' + that.no).click();
    }
  },

  _msg_post_processing: function(data, $msg){
    var that = this;
    that.setColorbox($msg.find('.thumbnail'));
    $msg.find('*').each(function(){
      emojify.run($(this).get(0));
    });

    that.play_sound(data.msg);
    $msg.find('span[rel=tooltip]').tooltip({placement: 'bottom'});
  },

  _message_own_handler: function(){
    var that = this;
    return function(data) {
      that.prepend_own_msg(data, function($msg){
        MessageDate.save(that.no, data.date);
        MessageDate.update(that.no);
        that._msg_post_processing(data, $msg);
      });
    }
  },

  _message_handler: function(){
    var that = this;
    return function(data) {
      MessageDate.save(that.no, data.date);

      that.prepend_msg(data,function($msg){
        that._msg_post_processing(data, $msg);
        that.do_notification(data);

        $msg.addClass("unread-msg");
        if (that.include_target_name(data.msg)){
          that.mentionCount(that.mentionCount() + 1);
        }else if (that.include_room_name(data.msg)){
          that.unreadRoomCount(that.unreadRoomCount() + 1);
        }else{
          that.unreadCount(that.unreadCount() + 1);
        }
      });
    }
  },

  _latest_log_handler: function() {
    var that = this;
    return function(msgs){
      that.isLoadingLog = false;

      // 読込中に新規読み込み要求が来たらやり直す
      if (that.reloadAgain){
        that.reloadAgain = false;
        that.reloadTimeline();
        return;
      }

      $('#message_loader').hide();

      if (msgs.length == 0){
        return;
      }

      var add_count = 0;
      for ( var i = 0 ; i < msgs.length; i++){
        if (that.append_msg(msgs[i])){ add_count++; }
      }

      if (add_count > 0){
        var $chat_body = $(that.listId);
        that.setColorbox($chat_body.find('.thumbnail'));

        $chat_body.find('*').each(function(){
          emojify.run($(this).get(0));
        });

        $(that.listId + ' span[rel=tooltip]').tooltip({placement: 'bottom'});
      }else{
        // 1件の場合はもうデータなし
        if (msgs.length == 1){
          return;
        }
        that.load_log_more(msgs[msgs.length-1]._id);
      }
    }
  },

  _room_name_handler: function() {
    var that = this;
    return function(room_name){
      that.room(room_name);
    }
  },

  destroySocket: function(){
    this.socket.removeListener("message_own" + this.no, this.on_message_own);
    this.socket.removeListener("message" + this.no, this.on_message);
    this.socket.removeListener("latest_log" + this.no, this.on_latest_log);
    this.socket.removeListener('room_name' + this.no, this.on_room_name);
  },

  reloadTimeline: function(){
    var that = this;
    that.clear_unread();
    $(that.listId).empty();

    var filterName = that.parent.getFilterName();
    var filterWord = that.parent.getFilterWord();

    // 既に読み込み中の場合は完了後に再度読み込み開始する
    if (that.isLoadingLog){
      that.reloadAgain = true;
    }else{
      that.isLoadingLog = true;
      that.socket.emit('latest_log', {room_id: that.no, name: filterName, word: filterWord});
      $('#message_loader').show();
    }
  },

  load_log_more: function(id){
    $('#message_loader').show();
    this.isLoadingLog = true;

    var filterName = this.parent.getFilterName();
    var filterWord = this.parent.getFilterWord();
    this.socket.emit('load_log_more', {room_id: this.no, id: id, name: filterName, word: filterWord});
  },

  clear_unread: function(){
    var that = this;
    MessageDate.update(that.no);
    $(this.listId).find('li').removeClass("unread-msg");
    this.mentionCount(0);
    this.unreadRoomCount(0);
    this.unreadCount(0);

    return true;
  },

  append_msg: function(data){
    var that = this;
    //TODO: System メッセージを非表示にする。
    //      切り替え可能にするかは検討する。
    if (data.name == "System") { return false; };
    if (this.exist_msg(data)){ return false; };

    var msg = this.get_msg_html(data);

    if (this.display_message(msg)){

      // 前回の最終メッセージよりも新しければ未読にする
      MessageDate.save(that.no, data.date);
      if (MessageDate.isNew(that.no, data.date)){
        msg.css += " unread-msg";

        if (that.include_target_name(data.msg)){
          that.mentionCount(that.mentionCount() + 1);
        }else if (that.include_room_name(data.msg)){
          that.unreadRoomCount(that.unreadRoomCount() + 1);
        }else{
          that.unreadCount(that.unreadCount() + 1);
        }
      }

      msg.is_visible = true;
      that.messages.push(msg);
      return true;
    }
    return false;
  },

  prepend_msg: function(data, callback){
    var that = this;

    //TODO: System メッセージを非表示にする。
    //      切り替え可能にするかは検討する。
    if (data.name == "System"){ return false; }
    if (this.exist_msg(data)){ return false; }

    var msg = this.get_msg_html(data);

    if (this.display_message(msg)){
      var msg_css = msg.css;
      msg.css = "";
      msg.is_visible = false;
      that.messages.unshift(msg);

      var $msg = $('#msg_' + msg._id);
      $msg.addClass("text-highlight",0);
      $msg.slideDown('fast',function(){
        $msg.switchClass("text-highlight", msg_css, 700);
      });

      callback($msg);
      return true;
    }else{
      this.parent.upHidingCount();
      return false;
    }
  },

  prepend_own_msg: function(data, callback){
    var that = this;
    if (this.exist_msg(data)){ return false; }
    var msg = this.get_msg_html(data);

    if (this.display_message(msg)){
      var msg_css = msg.css;
      msg.css = "";
      msg.is_visible = false;
      that.messages.unshift(msg);

      var $msg = $('#msg_' + msg._id);
      $msg.addClass("text-highlight",0);
      $msg.slideDown('fast',function(){
        $msg.switchClass("text-highlight", msg_css, 700);
      });

      callback($msg);
      return true;
    }else{
      this.parent.upHidingCount();
      return false;
    }
  },

  exist_msg: function(data){
    if (data.msg == undefined) { data.msg = ""; }
    var id = '#msg_' + data._id.toString();
    return $(id).length > 0;
  },

  get_msg_html: function(data){
    var disp_date = data.date.replace(/:\d\d$/,""); // 秒は削る
    if ( data.name == this.parent.getName()){
      return {
        html: this.get_msg_body(data) + '<a data-bind="click: $parent.remove_msg.bind($data, $element)" class="remove_msg">x</a><span class="own_msg_date">' + disp_date + '</span></td></tr></table>',
        css: "own_msg",
        _id: data._id.toString()
      };
    } else if (this.include_target_name(data.msg)){
      return {
        html: this.get_msg_body(data) + ' <span class="target_msg_date">' + disp_date + '</span></td></tr></table>',
        css: "target_msg",
        _id: data._id.toString()
      };
    } else if (this.include_room_name(data.msg)){
      return {
        html: this.get_msg_body(data) + ' <span class="room_msg_date">' + disp_date + '</span></td></tr></table>',
        css: "room_msg",
        _id: data._id.toString()
      };
    }else{
      return {
        html: this.get_msg_body(data) + ' <span class="date">' + disp_date + '</span></td></tr></table>',
        css: "normal_msg",
        _id: data._id.toString()
      };
    }
  },

  get_msg_body: function(data){
    var date = new Date();
    var id = date.getTime();

    var name_class = "login-name";
    var msg_class = "msg";

    data.id = this.parent.getId(data.name);

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
      return '<table width="100%"><tr><td nowrap valign="top" width="32px"><span class="login-symbol" data-name="' + data.name + '" title="' + data.name + '" rel="tooltip" data-bind="click: function(data, event){ $parents[1].inputLoginName(data, event, $element)}"><img class="avatar" src="' + data.avatar + '"></span></td><td><span class="msg_text ' + msg_class + '">' + this.decorate_msg(data.msg) + '</span>';
    }else{
      return '<table><tr><td nowrap valign="top"><span class="login-symbol login-elem ' + name_class + '" data-name="' + data.name + '" data-bind="click: function(data, event){ $parents[1].inputLoginName(data, event, $element)}"><span class="name">' + data.name + '</span></span></td><td width="100%"><span class="msg_text ' + msg_class + '">' + this.decorate_msg(data.msg) + '</span>';
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
    var name_reg = RegExp("@([^ |　|]+?)さん|@all|@" + that.room(), "g");

    var bq_sepa_array = msg.split("```");
    for (var i = 0; i < bq_sepa_array.length; i++){
      if (i%2 == 0){
        bq_sepa_array[i] = bq_sepa_array[i].replace( name_reg, function(){
          if (arguments[1] == that.parent.getName()||
            arguments[0] == "@みなさん"     ||
            arguments[0] == "@all"){
            return '<span class="target-me">' + arguments[0] + '</span>'
          }else if (arguments[0] == "@" + that.room()){
            return '<span class="target-room">' + arguments[0] + '</span>'
          }else{
            return '<span class="target-other">' + arguments[0] + '</span>'
          }
        });
      }
    }
    return bq_sepa_array.join("```");
  },

  escape_reg: function(target){
    return target.replace(/\W/g,"\\$&");
  },

  include_target_name: function(msg){
    var name = this.parent.getName();
    var name_reg = RegExp("@" + this.escape_reg(name) + "( |　|さん|$)");
    if (msg.match(name_reg)    ||
        msg.match("@みなさん") ||
        msg.toLowerCase().match("@all")){
      return true;
    }
    return false;
  },

  include_room_name: function(msg){
    var room_reg = RegExp("@" + this.escape_reg(this.room()) + "( |　|さん|$)");
    if (msg.match(room_reg)){
      return true;
    }
    return false;
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
      var sound_name = RegExp.$1.split(".")[0];
      ion.sound({
        sounds: [
          { name: sound_name }
        ],
        path: "/uploads/",
        volume: 1,
        ended_callback: function (obj) {
          ion.sound.destroy(obj.name);
        }
      });
      ion.sound.play(sound_name);
    }
  },

  display_message: function(msg){
    var that = this;
    if (that.parent.timeline() == "own"){
      if (msg.css == 'normal_msg'){
        return false;
      }
    }else if (that.parent.timeline() == "mention"){
      if (msg.css == 'normal_msg' || msg.css == 'own_msg'){
        return false;
      }
    }
    return true;
  },

  do_notification: function(data){
    var notif_msg = data.msg;
    var isMentionName = this.include_target_name(notif_msg);
    var isMentionRoom = this.include_room_name(data.msg);
    var isMention = isMentionName || (isMentionRoom && this.isActive());

    this.parent.doNotification(data, isMention, this.room());
  }
}

module.exports = ChatViewModel;
