function DiffViewModel(){
  this.active_no = 0;
  this.list = [];
  this.index = 0;
}

DiffViewModel.prototype = {
  start: function(){

  }
}

function MemoViewModel(){
  this.writing_text = {text: "", date: undefined};
  this.text_logs = [];

}

MemoViewModel.prototype = {
  insert: function(row, text){
    var text_array = this.writing_text.text.split("\n");
    text_array.splice(row,0,text);
    this.writing_text.text = text_array.join("\n");
  }
}
