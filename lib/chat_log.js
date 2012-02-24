var chat_log = [];
module.exports.add = function(data){
  chat_log.push(data)
  if (chat_log.length > 100){
    chat_log.shift();
  }
};

module.exports.get = function(){
  return chat_log;
};

module.exports.size = function(){
  return chat_log.length;
};
