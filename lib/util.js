
module.exports.getFullDate = function(date){
  var yy = date.getYear();
  var mm = date.getMonth() + 1;
  var dd = date.getDate();
  if (yy < 2000) { yy += 1900; }
  if (mm < 10) { mm = "0" + mm; }
  if (dd < 10) { dd = "0" + dd; }

  return yy + '/' + mm + '/' + dd + ' ' + date.toLocaleTimeString();
};

var fs = require('fs');
module.exports.getFileList = function(dir, callback){
  var file_list = [];
  fs.readdir(dir, function(err, files){
    if (err){
      callback([]);
    }

    callback(files);
  });
};

module.exports.getRandom = function(target){
  if (Array.isArray(target)){ 
    return target.sort(function() {return Math.random() - 0.5;})[0];
  }else{
    return target;
  }
};

var path = require('path');
module.exports.getMessagesFromJsonFile = function(json_file){
  var messages = require('./bots/' + json_file);
  delete(require.cache[path.resolve("./lib/bots/" + json_file)]);
  return messages;
};

module.exports.isUndefined = function(obj) {
  if (obj == undefined || obj === null){return true;}
  if (typeof obj === 'string' && obj === ""){return true;}
  if (Array.isArray(obj) && obj.join("") === ""){return true;}

  return false;
}

