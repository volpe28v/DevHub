function FaviconNumber(data) {
  var userAgent = window.navigator.userAgent.toLowerCase();

  this.canUseFavico = false;
  if (userAgent.indexOf('chrome') != -1) {
    this.canUseFavico = true;
  } else if (userAgent.indexOf('firefox') != -1) {
    this.canUseFavico = true;
  }

  this.newest_count = 0;
  this.title = document.title;

  this.favicon = new Favico({
    animation:'none'
  });
}

FaviconNumber.prototype = {
  update: function(count){
    this.newest_count = count;
    if (this.canUseFavico){
      this.favicon.badge(this.newest_count);
    }else{
      document.title = "(" + this.newest_count + ") " + this.title;
    }
  },
}

