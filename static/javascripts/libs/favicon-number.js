function FaviconNumber(data) {
  var userAgent = window.navigator.userAgent.toLowerCase();

  this.canUseFavico = false;
  if (userAgent.indexOf('chrome') != -1) {
    this.canUseFavico = true;
  } else if (userAgent.indexOf('firefox') != -1) {
    this.canUseFavico = true;
  }

  this.newest_count = 0;
  this.focus_id = data.focus_id;
  this.title = document.title;

  this.favicon = new Favico({
    animation:'none'
  });
}

FaviconNumber.prototype = {
  up: function(){
    if (this.focus_id == $(':focus').attr('id')){ this.off(); return false; }
    this.newest_count++;

    if (this.canUseFavico){
      this.favicon.badge(this.newest_count);
    }else{
      document.title = "(" + this.newest_count + ") " + this.title;
    }
    return true;
  },
  minus: function(count){
    if (this.focus_id == $(':focus').attr('id')){ this.off(); return false; }
    this.newest_count -= count;
    if (this.newest_count < 0){ this.newest_count = 0; }

    if (this.canUseFavico){
      this.favicon.badge(this.newest_count);
    }else{
      document.title = "(" + this.newest_count + ") " + this.title;
    }
    return true;
  },
  off: function(){
    this.newest_count = 0;

    if (this.canUseFavico){
      this.favicon.badge(this.newest_count);
    }else{
      document.title = this.title;
    }
  }
}

