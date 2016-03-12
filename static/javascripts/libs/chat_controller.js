var LOGIN_COLOR_MAX = 9;

function ChatController(param){
  var that = this;

  this.socket = param.socket;
  this.faviconNumber = param.faviconNumber;
  this.changedLoginName = param.changedLoginName;
  this.showRefPoint = param.showRefPoint;

  // Models
  this.loginName = ko.observable("");
  this.inputMessage = ko.observable("");
  this.inputMessage.subscribe(function (message){
    that.doClientCommand(message);
  }, this);

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

  this.chatViewModels = ko.observableArray([]);

  // Member function
  this.selectChatTab = function(){
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

  this.keydownInputMessage = function(data, event, element){
    if(window.localStorage.sendkey == 'ctrl'){
      if ( event.ctrlKey && event.keyCode == 13) {
        return that.sendMessage();
      }
    }else if (window.localStorage.sendkey == 'shift'){
      if ( event.shiftKey && event.keyCode == 13) {
        return that.sendMessage();
      }
    }else{
      if ((event.altKey || event.ctrlKey || event.shiftKey ) && event.keyCode == 13) {
        return true;
      }else if(event.keyCode == 13){
        return that.sendMessage();
      }
    }
    return true;
  }

  this.keydownInputName = function(data, event){
    if ( event.keyCode == 13) {
      that.changedLoginName(that.loginName());
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

  // initialize
  MessageDate.init();
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
    if ($('.textcomplete-wrapper .dropdown-menu').css('display') == 'none'){
      var name = that.loginName();
      var message = that.inputMessage();
      var avatar = window.localStorage.avatarImage;

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
    MessageDate.init(); // タイムラインを再読み込みしたら未読解除
    that.hidingMessageCount(0);

    if (window.localStorage.timeline == "mention"){
      $('#mention_alert').slideDown();
    }else{
      $('#mention_alert').slideUp();
    }
    if (window.localStorage.timeline == "own"){
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
      $('#message').addClass("client-command");
    }else if (message.match(/^room_name:/)){
      $('#message').addClass("client-command");
    }else if (message.match(/^m:$/)){
      $('#message').addClass("client-command");
      window.localStorage.timeline = "mention";
      that.doFilterTimeline();
    }else if (message.match(/^mo:$/)){
      $('#message').addClass("client-command");
      window.localStorage.timeline = "own";
      that.doFilterTimeline();
    }else{
      $('#message').removeClass("client-command");
      that.filterWord("");

      // mention か mention & own の場合はフィルタリングを解除
      if (window.localStorage.timeline != "all"){
        window.localStorage.timeline = "all";
        that.doFilterTimeline();
      }
    }

    return;
  },

  initChat: function(){
    var that = this;

    ko.applyBindings(that, $('#chat_inner').get(0));

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
    ]).autosize();

    $('#chat_body').exResize(function(){
      $('.chat-control').addClass('chat-fixed');
      $('.chat-control-dummy').show();
      $('.chat-control').width($(this).outerWidth());
    });

    $('.chat-control').exResize(function(){
      $('.chat-control-dummy').height($(this).outerHeight());
    });

    emojify.setConfig({
      img_dir: 'img/emoji',  // Directory for emoji images
    });

    // for chat list
    $('.chat-tab-content').on('inview', 'li:last-child', function(event, isInView, visiblePartX, visiblePartY) {
      // ログ追加読み込みイベント
      if (!isInView){ return false; }

      var data = ko.dataFor(this);
      var parent = ko.contextFor(this).$parent;
      parent.load_log_more(data._id);
    });

    $('#chat_body').on('click', '.close', function(){
      var data_id = $(this).closest(".alert").attr('id');
      if (data_id == "mention_own_alert"){
        window.localStorage.timeline = "all";
        that.inputMessage("");
        $('#message').removeClass("client-command");
      }else if (data_id == "mention_alert"){
        window.localStorage.timeline = "all";
        that.inputMessage("");
        $('#message').removeClass("client-command");
      }else if (data_id == "filter_name_alert"){
        that.filterName("");
      }else if (data_id == "filter_word_alert"){
        that.filterWord("");
        that.inputMessage("");
        $('#message').removeClass("client-command");
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

  initSocket: function(){
    var that = this;

    this.socket.on('remove_message', function(data) {
      $('#msg_' + data.id).fadeOut('normal',function(){
        $(this).remove();
      });
    });

    $('#chat_number').bind('change',function(){
      var num = $(this).val();
      that.socket.emit('chat_number', {num: num});
    });

    this.socket.on('chat_number', function(number) {
      if (number.num == 1){
        $('#chat_nav').css('display','none');
      }else{
        $('#chat_nav').css('display','block');
      }

      $('#chat_number').val(number.num);
      that.chatViewModels().forEach(function(vm){
        vm.destroySocket();
      });
      that.chatViewModels([]);
      for (var i = 1; i <= number.num; i++){
        that.chatViewModels.push(new ChatViewModel({
          no: i,
          socket: that.socket,
          getId: function(name) {return that.getId(name); },
          getName: function() {return that.getName(); },
          getFilterName: function() {return that.getFilterName(); },
          getFilterWord: function() {return that.getFilterWord(); },
          upHidingCount: function() {return that.upHidingCount(); },
          notifyChangeUnreadCount: function() {return that.updateFaviconNumber(); },
          showRefPoint: that.showRefPoint
        }));
      }

      $("#chat_tab_1").click();
    });

    this.socket.on('list', function(login_list) {
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
  },

  initDropzone: function(){
    var that = this;
    this.dropZone = new DropZone({
      dropTarget: $('#chat_area'),
      fileTarget: $('#upload_chat'),
      alertTarget: $('#loading'),
      pasteValid: true,
      uploadedAction: function(local_that, res){
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
