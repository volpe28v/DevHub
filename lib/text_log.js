var text_log = undefined;
var text_logs = [];
var text_log_id = 0;
var favo_logs = [];

module.exports.empty = function(){
  if (text_log == undefined ){
    return true;
  }else{
    return false;
  }
}

module.exports.get_latest = function(){
  return text_log;
}

module.exports.get_logs = function(){
  return text_logs;
}

module.exports.add = function(current_log){
  if (this.can_add(current_log)){
    this.add_impl(text_log)
    text_log = current_log
    console.log("add_text_log is true")
    return true
  }else{
    text_log = current_log
    return false
  }
}
 
module.exports.can_add = function(current_log){
  if (text_log == undefined ){ return false }
  // 同ユーザの書き込みであれば保留
  if (text_log.name == current_log.name ){ return false }

  // バックアップ対象が空文字と改行のみの場合は排除
  var blank = new RegExp("(^[ \r\n]+$|^$)");
  if (blank.test(text_log.text)) { return false }

  // 前回のバックアップと同様であれば保留
  if (text_logs.length > 0 && text_logs[0].text == text_log.text ){ return false }

  return true
}

module.exports.add_on_suspend = function(name){
  if (this.can_add_on_suspend(name)){
    this.add_impl(text_log)
    console.log("add_text_log_on_suspend is true")
    return true
  }else{
    return false
  }
}

module.exports.can_add_on_suspend = function(name){
  if (text_log == undefined){ return false }
  if (text_log.name != name ){ return false }

  // バックアップ対象が空文字と改行のみの場合は排除
  var blank = new RegExp("(^[ \r\n]+$|^$)");
  if (blank.test(text_log.text)) { return false }

  // 前回のバックアップと同様であれば保留
  if (text_logs.length > 0 && text_logs[0].text != text_log.text ){ return true }
  if (text_logs.length == 0){ return true }

  return false;
}

module.exports.add_impl = function(text_log){
  text_log.id = text_log_id;
  text_log_id += 1;
  text_logs.unshift(text_log)
  if (text_logs.length > 20){
    text_logs.pop();
  }
}

module.exports.remove = function(id){
  for ( var i = 0; i < text_logs.length; ++i){
    if ( text_logs[i].id == id ){
      text_logs.splice(i,1);
      console.log("removed id: ", id)
      return;
    }
  }
}

module.exports.is_change = function(msg){
  if (text_log == undefined){ return true;}
  if (text_log.text != msg){ return true;}

  return false;
}

module.exports.add_favo = function(id){
  for ( var i = 0; i < text_logs.length; ++i){
    if ( text_logs[i].id == id ){
      favo_logs.unshift(text_logs[i])
      console.log("add_favo id: ", id)
      return;
    }
  }
}

module.exports.remove_favo = function(id){
  for ( var i = 0; i < favo_logs.length; ++i){
    if ( favo_logs[i].id == id ){
      favo_logs.splice(i,1);
      console.log("remove_favo id: ", id)
      return;
    }
  }
}

