var LOGIN_COLOR_MAX = 9;

function ChatController(param){
  this.socket = param.socket;
  this.faviconNumber = param.faviconNumber;
  this.changedLoginName = param.changedLoginName;
  this.showRefPoint = param.showRefPoint;
  this.loginName = "";

  this.isSearching = false;

  // Models
  this.message = "";
  this.loginElemList = [];
  this.hidingMessageCount = 0;
  this.filterName = "";
  this.filterWord = "";
  this._filterWord = ""; // 前回の検索キーワード

  this.chatViewModels = [];

  // initialize
  MessageDate.init();
  this.initChat();
  this.initSettings();
  this.initSocket();
  this.initDropzone();
}

ChatController.prototype = {
  setMessage: function(message){
    var exist_msg = $('#message').val();
    if ( exist_msg == ""){
      exist_msg += message + " ";
    }else{
      if (exist_msg.slice(-1) == " "){
        exist_msg += message + " ";
      }else{
        exist_msg += " " + message + " ";
      }
    }
    $('#message').focus().val(exist_msg).trigger('autosize.resize');
  },

  sendMessage: function(){
    var that = this;

    // 絵文字サジェストが表示中は送信しない
    if ($('.textcomplete-wrapper .dropdown-menu').css('display') == 'none'){
      var name = $('#name').val();
      var message = $('#message').val();
      var avatar = window.localStorage.avatarImage;

      if ( message && name ){
        $('#message').attr('value', '').trigger('autosize.resize');
        var room_id = $("#chat_nav").find(".active").find("a").data("id");
        that.socket.emit('message', {name:name, avatar:avatar, room_id: room_id, msg:message});

        if (that.loginName != name){
          that.loginName = name;
          that.changedLoginName(name);
        }
      }
      return false;
    }else{
      return true;
    }
  },

  doClientCommand: function(message){
    var that = this;
    if (message.match(/^search:(.*)/) || message.match(/^\/(.*)/)){
      var search_word = RegExp.$1;
      $.observable(that).setProperty("filterWord", search_word);
      $('#message').addClass("client-command");

      // 検索キーワードが変化していたら1秒後に検索開始
      if (!that.isSearching && that._filterWord != that.filterWord){
        that.isSearching = true;
        setTimeout(function(){
          if (!that.isSearching){ return; }
          if (that._filterWord == that.filterWord){ that.isSearching = false; return; }
          $('#timeline_all').attr('checked', 'checked');
          $('#timeline_all').trigger("change");
          if (that.filterWord == ""){
            $('#filter_word_alert').slideUp();
          }else{
            $('#filter_word_alert').slideDown();
          }
          that._filterWord = that.filterWord;
          that.isSearching = false;
        },1000);
      }
    }else if (message.match(/^room_name:/)){
      $('#message').addClass("client-command");
    }else{
      $('#message').removeClass("client-command");
      // 検索中または前回検索済みの場合は検索結果をクリア
      if (that.isSearching == true || that._filterWord != ""){
        that.isSearching = false;
        $.observable(that).setProperty("filterWord", "");
        that._filterWord = "";
        $('#timeline_all').attr('checked', 'checked');
        $('#timeline_all').trigger("change");
      }
    }

    return;
  },

  initChat: function(){
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
    ]).on('keydown',function(event){
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
    }).on('keyup',function(event){
      var message = $('#message').val();
      that.doClientCommand(message);
    }).autosize();

    $('#send_button').click(function(){
      that.sendMessage();
      return false;
    });

    // ログインリストのバインディング
    $.templates("#loginNameTmpl").link("#login_list_body", that.loginElemList);
    $.templates("#alertTimelineTmpl").link("#alert_timeline", that);

    $('#chat_area').on('click', '.login-symbol', function(event){
      if (event.shiftKey == true ){
        $.observable(that).setProperty("filterName", $(this).data("name"));

        $('#timeline_all').attr('checked', 'checked');
        $('#timeline_all').trigger("change");

        $('#filter_name_alert').slideDown();
        $('.tooltip').hide();
        $('#chat_area').scrollTop(0);
      }else{
        var name = $(this).data("name");
        that.setMessage("@" + name + "さん");
      }
    });

    // アップロードボタン
    $('#upload_chat_button').click(function(){
      $('#upload_chat').click();
      return false;
    });

    emojify.setConfig({
      img_dir: 'img/emoji',  // Directory for emoji images
    });

    // for chat list
    $.templates("#chatTabTmpl").link("#chat_nav", this.chatViewModels)
      .on('click', '.chat-tab-elem', function(){
        var thisVm = that.chatViewModels[$.view(this).getIndex()];
        if (thisVm.isActive){
          // 部屋名をフォームに設定する
          that.setMessage("@" + thisVm.room + " ");
        }

        that.chatViewModels.forEach(function(vm){
          vm.set_active(false);
        });
        thisVm.set_active(true);
        return true;
      });
    $.templates("#chatTmpl").link(".chat-tab-content", this.chatViewModels)
      .on('inview', 'li:last-child', function(event, isInView, visiblePartX, visiblePartY) {
        // ログ追加読み込みイベント
        if (!isInView){ return false; }

        var last_msg_id = $(this).data("id");
        that.chatViewModels[$.view(this).index].load_log_more(last_msg_id);
      })
      .on('click', '.remove_msg', function(){
        var data_id = $(this).closest('li').data('id');
        that.chatViewModels[$.view(this).index].remove_msg(data_id);
        return true;
      })
      .on('click', '.ref-point', function(){
        var id = $(this).attr("id");
        that.showRefPoint(id);
        return true;
      })
      .on('click', '.chat-list', function(){
        that.chatViewModels[$.view(this).index].clear_unread();
        return true;
      });
  },

  setName: function(name){
    this.loginName = name;
    $('#name').val(name);
    this.changedLoginName(name);
  },

  getName: function(){
    return this.loginName;
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
      socket.emit('chat_number', {num: num});
    });

    this.socket.on('chat_number', function(number) {
      if (number.num == 1){
        $('#chat_nav').css('display','none');
      }else{
        $('#chat_nav').css('display','block');
      }

      $('#chat_number').val(number.num);
      that.chatViewModels.forEach(function(vm){
        vm.destroySocket();
      });
      $.observable(that.chatViewModels).refresh([]);
      for (var i = 1; i <= number.num; i++){
        $.observable(that.chatViewModels).insert(new ChatViewModel({
          no: i,
          socket: that.socket,
          getId: function(name) {return that.getId(name); },
          getName: function() {return that.getName(); },
          getFilterName: function() {return that.getFilterName(); },
          getFilterWord: function() {return that.getFilterWord(); },
          upHidingCount: function() {return that.upHidingCount(); },
          faviconNumber: that.faviconNumber
        }));
      }

      $("#chat_tab_1").click();
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
            color_id: "login-symbol login-elem login-name" + that.getColorIdByNameId(login_list[i].id),
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
  },

  initDropzone: function(){
    this.dropZone = new DropZone({
      dropTarget: $('#chat_area'),
      fileTarget: $('#upload_chat'),
      alertTarget: $('#loading'),
      pasteValid: true,
      uploadedAction: function(that, res){
        $('#message').val($('#message').val() + ' ' + res.fileName + ' ').trigger('autosize.resize');
      }
    });
  },

  getColorIdByNameId: function(id){
    if(id == 0){ return 0; } // no exist user.
    return id % LOGIN_COLOR_MAX + 1; // return 1 〜 LOGIN_COLOR_MAX
  },

  getId: function(name){
    for(var i = 0; i < this.loginElemList.length; ++i ){
      if ( this.loginElemList[i].name == name ){
        return this.loginElemList[i].id;
      }
    }
    return 0;
  },

  upHidingCount: function(){
    $.observable(this).setProperty("hidingMessageCount", this.hidingMessageCount + 1);
  },

  getFilterName: function(){
    return this.filterName;
  },

  getFilterWord: function(){
    return this.filterWord;
  },

  initSettings: function(){
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
          if(Notification){
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
        $('#avatar_img').attr('src', window.localStorage.avatarImage);
      }

      $('#avatar_set').on('click',function(){
        window.localStorage.avatarImage = $('#avatar').val();
        $('#avatar_img').attr('src', window.localStorage.avatarImage);

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
          if (that.filterWord == ""){
            $('#filter_word_alert').slideUp();
          }
          if (that.filterName == ""){
            $('#filter_name_alert').slideUp();
          }

          $('#mention_own_alert').slideUp();
          $('#mention_alert').slideUp();
        }else if (mode == 'own'){
          $('.alert').hide();
          $('#mention_own_alert').slideDown();
          $.observable(that).setProperty("filterName", "");
        }else{
          $('.alert').hide();
          $('#mention_alert').slideDown();
          $.observable(that).setProperty("filterName", "");
        }

        $.observable(that).setProperty("hidingMessageCount", 0);

        that.chatViewModels.forEach(function(vm){
          vm.reloadTimeline();
        });
      });

      // for Send Message Key
      if(window.localStorage.sendkey == 'ctrl'){
        $('#send_ctrl').attr('checked', 'checked');
      }else if (window.localStorage.sendkey == 'shift'){
        $('#send_shift').attr('checked', 'checked');
      }else{
        $('#send_enter').attr('checked', 'checked');
      }

      $('.send-message-key-radio').on('change', "input", function(){
        var key = $(this).val();
        window.localStorage.sendkey = key;
      });

      $('#chat_body').on('click', '.close', function(){
        var data_id = $(this).closest(".alert").attr('id');
        if (data_id == "memtion_own_alert"){

        }else if (data_id == "mention_alert"){

        }else if (data_id == "filter_name_alert"){
          $.observable(that).setProperty("filterName", "");
        }else if (data_id == "filter_word_alert"){
          $.observable(that).setProperty("filterWord", "");
          that._filterWord = "";
          $('#message').val("");
          $('#message').removeClass("client-command");
        }

        $('#timeline_all').attr('checked', 'checked');
        $('#timeline_all').trigger("change");
        return false;
      });
    }else{
      $('#notification').attr('disabled', 'disabled');
    }
  }
}
