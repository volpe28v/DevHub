var COOKIE_NAME = "dev_hub_name"; // legacy 
require('jquery.cookie'); // legacy

var ko = require('knockout');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);

require('ion-sound');

function SettingViewModel(param){
  var that = this;

  this.socket = param.socket;

  // login name
  this.loginName = ko.observable(window.localStorage.loginName != null ? window.localStorage.loginName : $.cookie(COOKIE_NAME));
  this.loginName.subscribe(function(newValue){
    window.localStorage.loginName = newValue;
  });

  // notification mode
  this.notificationMode = ko.observable(window.localStorage.popupNotification != null ? window.localStorage.popupNotification : 'disable');
  this.notificationMode.subscribe(function(newValue){
    window.localStorage.popupNotification = newValue;
    if (newValue != "disable"){
      if(Notification){
        Notification.requestPermission();
      }
    }
  });

  // notification seconds
  this.notificationSeconds = ko.observable(window.localStorage.notificationSeconds != null ? window.localStorage.notificationSeconds : 5);
  this.notificationSeconds.subscribe(function(newValue){
    window.localStorage.notificationSeconds = newValue;
  });

  // notification sound
  this.notificationSoundMode = ko.observable(window.localStorage.notificationSoundMode == "on" ? "on" : "off");
  this.notificationSoundMode.subscribe(function(newValue){
    window.localStorage.notificationSoundMode = newValue;
  });

  this.notificationSounds = ko.observableArray([
    { name: "snap" ,           dispName: "snap" ,    alias: "s2" },
    { name: "pop_cork",        dispName: "pop_cork", alias: "s9" },
    { name: "tap",             dispName: "tap",      alias: "s10"},
    { name: "glass",           dispName: "glass",    alias: "s1" },
    { name: "water_droplet",   dispName: "water1",   alias: "s3" },
    { name: "water_droplet_2", dispName: "water2",   alias: "s4" },
    { name: "water_droplet_3", dispName: "water3",   alias: "s5" },
    { name: "button_click_on", dispName: "button1",  alias: "s6" },
    { name: "button_push"    , dispName: "button2",  alias: "s7" },
    { name: "button_tiny",     dispName: "button3",  alias: "s8" },
    { name: "upload",          dispName: "*upload sound*",  alias: "up" },
  ]);
  var notiSound = this.notificationSounds().filter(function(sound){ return sound.alias == window.localStorage.notificationSound; })[0];
  this.selectedNotiSound = ko.observable(notiSound != null ? notiSound.alias : this.notificationSounds()[0].alias);
  this.selectedNotiSound.subscribe(function(newValue){
    window.localStorage.notificationSound = newValue;
  });
  this.uploadedSound = ko.observable(window.localStorage.notificationUploadedSound);
  this.uploadedSound.subscribe(function(newValue){
    window.localStorage.notificationUploadedSound = newValue;
  });


  // avatar
  this.avatar = ko.observable(window.localStorage.avatarImage != null ? window.localStorage.avatarImage : "");

  // send key
  this.sendKey = ko.observable(window.localStorage.sendkey != null ? window.localStorage.sendkey : "enter");
  this.sendKey.subscribe(function(newValue){
    window.localStorage.sendkey = newValue;
  });

  // memo tab style
  this.memoTabStyle = ko.observable(window.localStorage.tabChanged == 'vertical' ? 'vertical' : 'horizontal'); 
  this.memoTabStyle.subscribe(function(newValue){
    window.localStorage.tabChanged = newValue;
  });

  // memo current no
  this.selectedMemoNo = ko.observable(window.localStorage.tabSelectedNo != null ? window.localStorage.tabSelectedNo : 1);
  this.selectedMemoNo.subscribe(function(newValue){
    window.localStorage.tabSelectedNo = newValue;
  });

  this.init = function(){
    // for Timeline
    if(window.localStorage.timeline == 'own'){
      $('#mention_own_alert').show();
    }else if (window.localStorage.timeline == 'mention'){
      $('#mention_alert').show();
    }
  }

  this.doNotification = function(data, isMention, room){
    if (that.notificationMode() == 'true' ||
        (that.notificationMode() == 'mention' && isMention)){
      if(Notification){
        if (Notification.permission != "denied"){
          that._do_notification(data, room);
          that.playNotificationSound();
        }
      }else{
        Notification.requestPermission();
      }
    }
  }

  this._do_notification = function(data, room){
    var notif_title = data.name + (TITLE_NAME != "" ? " @" + TITLE_NAME : "") + " -> " + room;
    var notif_icon = 'notification.png';
    if (data.avatar != null && data.avatar != "" && data.avatar != "undefined"){
      notif_icon = data.avatar;
    }
    var notif_msg = data.msg;

    var notification = new Notification(notif_title, {
      icon: notif_icon,
      body: notif_msg
    });
    setTimeout(function(){
      notification.close();
    }, that.notificationSeconds() * 1000);
  }


  this.playNotificationSound = function(){
    if (that.notificationSoundMode() == "off"){ return; }

    if (that.selectedNotiSound() == "up"){
      if (that.uploadedSound() == null){ return; }

      var sound_name = that.uploadedSound().replace(".mp3","");
      ion.sound({
        sounds: [ { name: sound_name } ],
        path: "/uploads/",
        volume: 1
      });

      ion.sound.play(sound_name);
    }else{
      ion.sound({
        sounds: that.notificationSounds(),
        path: "/sounds/",
        volume: 1
      });

      ion.sound.play(that.selectedNotiSound());
    }
  }

  this.login_action = function(){
    var name = that.loginName();

    if ( name != "" ){
      that.set_avatar();
      //that.chatController.focus();
    }
    $('#name_in').modal('hide')
  }

  this.set_avatar = function(){
    window.localStorage.avatarImage = that.avatar();

    that.socket.emit('name',
      {
        name: that.loginName(),
        avatar: that.avatar()
      });
    return false;
  }

  this.upload_avatar = function(){
    $('#upload_avatar').click();
    return false;
  }

  this.upload_sound = function(){
    $('#upload_sound').click();
    return false;
  }
 
  this.judgeSendKey = function(event){
    if(that.sendKey() == 'ctrl'){
      if ( event.ctrlKey && event.keyCode == 13) {
        return true;
      }
    }else if (that.sendKey() == 'shift'){
      if ( event.shiftKey && event.keyCode == 13) {
        return true;
      }
    }else{
      if ((event.altKey || event.ctrlKey || event.shiftKey ) && event.keyCode == 13) {
        return false;
      }else if(event.keyCode == 13){
        return true;
      }
    }
    return false;
  }


}

module.exports = SettingViewModel;
