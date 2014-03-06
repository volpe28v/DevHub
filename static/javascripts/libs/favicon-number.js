function FaviconNumber(data) {
  var userAgent = window.navigator.userAgent.toLowerCase();

  this.isUseFavico = false;
  if (userAgent.indexOf('chrome') != -1) {
    this.isUseFavico = true;
  } else if (userAgent.indexOf('firefox') != -1) {
    this.isUseFavico = true;
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
        if (this.focus_id == $(':focus').attr('id')){ this.off(); return; }
        this.newest_count++;

        if (this.isUseFavico){
          this.favicon.badge(this.newest_count);
        }else{
          document.title = "(" + this.newest_count + ") " + this.title;
        }
      },
  off: function(){
         this.newest_count = 0;

         if (this.isUseFavico){
           this.favicon.badge(this.newest_count);
         }else{
           document.title = this.title;
         }
       }
}

