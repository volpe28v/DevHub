var LOGIN_COLOR_MAX = 9;

global.jQuery = require('jquery');
global.$ = global.jQuery;

var ko = require('knockout');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);

var DropZone = require('../libs/dropzone');
var ChatViewModel = require('./chat_view_model');

function ChatController(param){
  var that = this;

  this.socket = param.socket;
  this.faviconNumber = param.faviconNumber;
  this.showRefPoint = param.showRefPoint;
  this.doNotification = param.settingViewModel.doNotification;
  this.settingViewModel = param.settingViewModel;

  // Models
  this.loginName = ko.observable("");
  this.inputMessage = ko.observable("");
  this.inputMessage.subscribe(function (message){
    that.doClientCommand(message);
  }, this);

  this.chatNumber = ko.observable(1);
  var chatMaxNumberTemp = [];
  for(var i = 1; i <= 10; i++){
    chatMaxNumberTemp.push({no:i});
  }
  this.chatMaxNumber = ko.observableArray(chatMaxNumberTemp);

  this.ownName = ko.observable();
  this.loginElemList = ko.observableArray([]);
  this.hidingMessageCount = ko.observable(0);
  this.filterName = ko.observable("");

  this.filterWord = ko.observable("");
  this.delayedFilterWord = ko.pureComputed(this.filterWord)
    .extend({ rateLimit: { method: "nofityWhenChangesStop", timeout: 500 }});
  this.delayedFilterWord.subscribe(function (val){
    that.doFilterTimeline();
  }, this);
  this.isCommand = ko.observable(false);

  this.chatViewModels = ko.observableArray([]);
  this.isTabMoving = false;

  this.timeline = ko.observable("all");

  // Member function
  this.selectChatTab = function(){
    if(that.isTabMoving){ return; }

    var thisVm = this;
    if (thisVm.isActive()){
      // 部屋名をフォームに設定する
      that.setMessage("@" + thisVm.room() + " ");
    }

    that.chatViewModels().forEach(function(vm){
      if (vm == thisVm){
        thisVm.set_active(true);
      }else{
        vm.set_active(false);
      }
    });
    return true;
  }

  this.startTabMoving = function(){
    that.isTabMoving = true;
  }

  this.stopTabMoving = function(tabs){
    that.isTabMoving = false;

    var tab_numbers = tabs.map(function(m){ return m.replace('chat_li_',''); });
    that.socket.emit('chat_tab_numbers', {numbers: tab_numbers});
  }

  this.keydownInputMessage = function(data, event, element){
    if(that.settingViewModel.judgeSendKey(event)){
      return that.sendMessage();
    }
    return true;
  }

  this.inputLoginName = function(data, event, element){
    if (event.shiftKey == true ){
      that.filterName($(element).data("name"));
      $('.tooltip').hide();
      $('#chat_area').scrollTop(0);
      that.doFilterTimeline();
    }else{
      var name = $(element).data("name");
      that.setMessage("@" + name + "さん");
    }
  }

  this.changeLoginName = function(){
    $('#name_in').modal("show");
  }

  this.changeChatNumber = function(){
    that.socket.emit('chat_number', {num: that.chatNumber()});
  }

  this.initSocket = function(){
    that.socket.on('remove_message', function(data) {
      $('#msg_' + data.id).fadeOut('normal',function(){
        $(this).remove();
      });
    });

    that.socket.on('chat_number', function(number) {
      if (number.num == 1){
        $('#chat_nav').css('display','none');
      }else{
        $('#chat_nav').css('display','block');
      }

      if (that.chatNumber() != number.num){
        that.chatNumber(number.num);
      }
      that.chatViewModels().forEach(function(vm){
        vm.destroySocket();
      });

      var active_numbers = that.getActiveNumbers(number.num, number.numbers);

      that.chatViewModels([]);
      $('#chat_nav').empty();
      active_numbers.forEach(function(no){
        no = Number(no);
        var room_name = "Room" + no;
        if (number.rooms != null){
          var room = number.rooms.filter(function(elem){ return elem.no == no; })[0];
          if (room != null){
            room_name = room.name;
          }
        }

        that.chatViewModels.push(new ChatViewModel({
          no: no,
          room_name: room_name,
          socket: that.socket,
          parent: that,
          showRefPoint: that.showRefPoint
        }));
      });

      $("#chat_tab_" + that.chatViewModels()[0].no).click();
    });

    that.getActiveNumbers = function(num, numbers){
      num = Number(num);
      var active_numbers = [];

      // numbers が null なら連番
      if (numbers == null){
        for(var i = 1; i <= num; i++){
          active_numbers.push(i);
        }
        return active_numbers;
      }

      // num 以下なら不足分を補間
      if (num > numbers.length){
        active_numbers = numbers;

        var search_number = 1;
        while (num > active_numbers.length){
          if (numbers.filter(function(elem){ return elem == search_number; }).length == 0){
            active_numbers.push(search_number);
          }
          search_number++;
        }
      }

      // num 以上なら num まで取得
      if (num <= numbers.length){
        return numbers.slice(0,num);
      }
    }

    that.socket.on('chat_tab_numbers', function(number) {
      number.numbers.forEach(function(num){
        $('#chat_nav').append($('#chat_li_' + num));
      });
    });


    that.socket.on('list', function(login_list) {
      $('#login_list_loader').hide();
      $('#login_list span[rel=tooltip]').tooltip('hide');

      var login_elems = [];
      var avatar_elems = [];
      for (var i = 0; i < login_list.length; ++i){
        var place = "";
        if ( login_list[i].place != "" ){
          place = "@" + login_list[i].place;
        }

        var login_elem = {
            id: login_list[i].id,
            color_id: "login-symbol login-elem login-name" + that.getColorIdByNameId(login_list[i].id),
            name: login_list[i].name,
            avatar: login_list[i].avatar,
            place: place,
            pomo_min: login_list[i].pomo_min
          };
        if (login_list[i].avatar != undefined && login_list[i].avatar != ""){
          login_elem.has_avatar = true;
          if (login_elem.name == that.loginName()){
            that.ownName(login_elem);
          }else{
            avatar_elems.push(login_elem);
          }
        }else{
          login_elem.has_avatar = false;
          if (login_elem.name == that.loginName()){
            that.ownName(login_elem);
          }else{
            login_elems.push(login_elem);
          }
        }
      }
      that.loginElemList(avatar_elems.concat(login_elems));
      $('#login_list span[rel=tooltip]').tooltip({placement: 'bottom'});
    });
  }

  // initialize
  this.initChat();
  this.initSocket();
  this.initDropzone();
}

ChatController.prototype = {
  setMessage: function(message){
    var that = this;
    var exist_msg = that.inputMessage();
    if ( exist_msg == ""){
      exist_msg += message + " ";
    }else{
      if (exist_msg.slice(-1) == " "){
        exist_msg += message + " ";
      }else{
        exist_msg += " " + message + " ";
      }
    }
    that.inputMessage(exist_msg);
    $('#message').focus().trigger('autosize.resize');
  },

  sendMessage: function(){
    var that = this;

    // 検索中は送信しない
    if (that.filterWord() != ""){ return false; }

    // 絵文字サジェストが表示中は送信しない
    if ($('.textcomplete-dropdown').css('display') == 'none'){
      var name = that.loginName();
      var message = that.inputMessage();
      var avatar = that.settingViewModel.avatar();

      if ( message && name ){
        that.inputMessage("");
        $('#message').trigger('autosize.resize');
        var room_id = $("#chat_nav").find(".active").find("a").data("id");
        that.socket.emit('message', {name:name, avatar:avatar, room_id: room_id, msg:message});
      }

      return false;
    }else{
      return true;
    }
  },

  uploadFile: function(){
    $('#upload_chat').click();
    return false;
  },

  doFilterTimeline: function(){
    var that = this;
    that.hidingMessageCount(0);

    if (that.timeline() == "mention"){
      $('#mention_alert').slideDown();
    }else{
      $('#mention_alert').slideUp();
    }
    if (that.timeline() == "own"){
      $('#mention_own_alert').slideDown();
    }else{
      $('#mention_own_alert').slideUp();
    }

    if (that.filterWord() != ""){
      $('#filter_word_alert').slideDown();
    }else{
      $('#filter_word_alert').slideUp();
    }

    if (that.filterName() != ""){
      $('#filter_name_alert').slideDown();
    }else{
      $('#filter_name_alert').slideUp();
    }

    this.chatViewModels().forEach(function(vm){
      vm.reloadTimeline();
    });
  },

  doClientCommand: function(message){
    var that = this;
    if (message.match(/^search:(.*)/) || message.match(/^\/(.*)/)){
      var search_word = RegExp.$1;
      that.filterWord(search_word);
      that.isCommand(true);
    }else if (message.match(/^room_name:/)){
      that.isCommand(true);
    }else if (message.match(/^m:$/)){
      that.isCommand(true);
      that.timeline("mention");
      that.doFilterTimeline();
    }else if (message.match(/^mo:$/)){
      that.isCommand(true);
      that.timeline("own");
      that.doFilterTimeline();
    }else if (message.match(/^play:/)){
      that.isCommand(true);
    }else{
      that.isCommand(false);
      that.filterWord("");

      // mention か mention & own の場合はフィルタリングを解除
      if (that.timeline() != "all"){
        that.timeline("all");
        that.doFilterTimeline();
      }
    }

    return;
  },

  initChat: function(){
    var that = this;

    $('#chat_body').exResize(function(){
      $('.chat-control').addClass('chat-fixed');
      $('.chat-control-dummy').show();
      $('.chat-control').width($(this).outerWidth());
    });

    $('.chat-control').exResize(function(){
      $('.chat-control-dummy').height($(this).outerHeight());
    });

    // for chat list
    $('#chat_body').on('click', '.close', function(){
      var data_id = $(this).closest(".alert").attr('id');
      if (data_id == "mention_own_alert"){
        that.timeline("all");
        that.inputMessage("");
        that.isCommand(false);
      }else if (data_id == "mention_alert"){
        that.timeline("all");
        that.inputMessage("");
        that.isCommand(false);
      }else if (data_id == "filter_name_alert"){
        that.filterName("");
      }else if (data_id == "filter_word_alert"){
        that.filterWord("");
        that.inputMessage("");
        that.isCommand(false);
      }

      that.doFilterTimeline();

      return false;
    });

  },

  setName: function(name){
    this.loginName(name);
  },

  getName: function(){
    return this.loginName();
  },

  focus: function(){
    $('#message').focus().trigger('autosize.resize');
  },

  setWidth: function(width){
    $('#chat_area').css('width',width + 'px').css('margin',0);
  },


  initDropzone: function(){
    var that = this;
    this.dropZone = new DropZone({
      dropTarget: $('#chat_area'),
      fileTarget: $('#upload_chat'),
      alertTarget: $('#loading'),
      pasteValid: true,
      uploadedAction: function(local_that, res){
        if (res.fileName == null){ return; }
        that.inputMessage(that.inputMessage() + ' ' + res.fileName + ' ');
        $('#message').trigger('autosize.resize');
      }
    });
  },

  getColorIdByNameId: function(id){
    if(id == 0){ return 0; } // no exist user.
    return id % LOGIN_COLOR_MAX + 1; // return 1 〜 LOGIN_COLOR_MAX
  },

  getId: function(name){
    for(var i = 0; i < this.loginElemList().length; ++i ){
      if ( this.loginElemList()[i].name == name ){
        return this.loginElemList()[i].id;
      }
    }
    if (this.ownName().name == name){
      return this.ownName().id;
    }
    return 0;
  },

  upHidingCount: function(){
    this.hidingMessageCount(this.hidingMessageCount() + 1);
  },

  getFilterName: function(){
    return this.filterName();
  },

  getFilterWord: function(){
    return this.filterWord();
  },

  updateFaviconNumber: function(){
    var sumUnreadCount = 0;
    this.chatViewModels().forEach(function(vm){
      sumUnreadCount += vm.allUnreadCount();
    });
    this.faviconNumber.update(sumUnreadCount);
  },
}

module.exports = ChatController;
