window.MessageDate = {
  init: function(){
    window.localStorage.lastMessageDate = window.localStorage.lastMessageDateCurrent;
  },
  save: function(date){
    if (window.localStorage.lastMessageDateCurrent){
      if (window.localStorage.lastMessageDateCurrent < date){
        window.localStorage.lastMessageDateCurrent = date;
      }
    }else{
      window.localStorage.lastMessageDateCurrent = date;
    }
  },
  isNew: function(date){
    if (window.localStorage.lastMessageDate && date > window.localStorage.lastMessageDate){
      return true;
    }else{
      return false;
    }
  }
};

