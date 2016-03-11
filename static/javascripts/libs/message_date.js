var localStorage = window.localStorage;

window.MessageDate = {
  init: function(){
  },
  save: function(no, date){
    var currentDate = localStorage.getItem('lastMessageDateCurrent' + no);
    if (currentDate){
      if (currentDate < date){
        localStorage.setItem('lastMessageDateCurrent' + no, date);
      }
    }else{
      localStorage.setItem('lastMessageDateCurrent' + no, date);
    }

    var lastDate = localStorage.getItem('lastMessageDate' + no);
    if (!lastDate){
      localStorage.setItem('lastMessageDate' + no, moment(new Date()).format('YYYY/MM/DD hh:mm:ss'));
    }
  },
  update: function(no){
    localStorage.setItem('lastMessageDate' + no, localStorage.getItem('lastMessageDateCurrent' + no));
  },

  isNew: function(no, date){
    var lastDate = localStorage.getItem('lastMessageDate' + no);
    console.log(no + " : " + lastDate);
    if (lastDate && date > lastDate){
      return true;
    }else{
      return false;
    }
  }
};

