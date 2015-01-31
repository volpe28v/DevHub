function MemoViewModel(){
  this.writing_text = {text: "", date: undefined};
  this.text_logs = [];

  this.diff_mode = false;
  this.diff_list = [];
  this.diff_index = 0;
}

MemoViewModel.prototype = {
  insert: function(row, text){
    var text_array = this.writing_text.text.split("\n");
    text_array.splice(row,0,text);
    this.writing_text.text = text_array.join("\n");
  },
  getLogsForDiff: function(){
    var out_logs = this.text_logs;
    if (this.writing_text.date != out_logs[0].date){
      out_logs.unshift(this.writing_text);
    }

    return out_logs;
  },
  createDiff: function(index){
    var base   = difflib.stringAsLines(this.text_logs[index].text);
    var newtxt = difflib.stringAsLines(this.writing_text.text);
    var sm = new difflib.SequenceMatcher(base, newtxt);
    var opcodes = sm.get_opcodes();

    var diff_body = diffview.buildView({
      baseTextLines: base,
      newTextLines: newtxt,
      opcodes: opcodes,
      baseTextName: "Current",
      newTextName: this.text_logs[index].date + " - " + this.text_logs[index].name,
      viewType: 1
    });

    this.diff_list = $(diff_body).find(".insert,.delete");
    this.diff_index = 0;
    this.diff_mode = true;

    return diff_body;
  },
  getNextDiffPos: function(){
    var $current_diff_td = $(this.diff_list[this.diff_index]);
    var pos = $current_diff_td.offset().top;

    // 次の差分グループを検索
    var $diff_table = $current_diff_td.closest("table");
    var pre_index = $diff_table.find("tr").index($current_diff_td.closest("tr"));
    while(1){
      this.diff_index++;
      var $next_diff_td = $(this.diff_list[this.diff_index]);

      if (this.diff_index >= this.diff_list.length){ this.diff_index = 0 }
      var next_index = $diff_table.find("tr").index($next_diff_td.closest("tr"));
      if (next_index - pre_index != 1){ break; }
      pre_index = next_index;
    }

    return pos;
  },
  endDiff: function(){
    this.diff_list = [];
    this.diff_index = 0;
    this.diff_mode = false;
  },
  applyToWritingText: function(func){
    this.writing_text.text = func(this.writing_text.text);
  }

}
