var moment = require("moment");

module.exports.getFullDate = function(date){
  return moment(date).format("YYYY/MM/DD HH:mm:ss")
};

module.exports.getFullDateNoSepa = function(date){
  return moment(date).format("YYYYMMDDHHmmss")
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

module.exports.getFileListAndSize = function(dir, callback){
  fs.readdir(dir, function(err, files){
    if (err){
      callback([]);
    }

    var file_list = new Array;
    var all_size = 0;
    files.forEach(function(name){
      if (name != 'save_img_here.txt'){
        var stat = fs.statSync(dir + "/" + name);
        file_list.push({name: name, size: stat.size, date: stat.ctime});
        all_size += stat.size;
      }
    });
    callback({all_size: all_size, files: file_list.sort(function(a,b){ return b['date'] - a['date'] }) });
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
module.exports.getSettingFromJsonFile = function(json_file){
  // xxxx.json が無ければ xxxx_default.json を読み込む
  var setting = []
  try {
    setting = require('./bots/' + json_file + ".json");
    delete(require.cache[path.resolve("./lib/bots/" + json_file + ".json")]);
  }catch(e){
    setting = require('./bots/' + json_file + "_default.json");
    delete(require.cache[path.resolve("./lib/bots/" + json_file + "_default.json")]);
  }
  return setting;
};

module.exports.isUndefined = function(obj) {
  if (obj == undefined || obj === null){return true;}
  if (typeof obj === 'string' && obj === ""){return true;}
  if (Array.isArray(obj) && obj.join("") === ""){return true;}

  return false;
}

