var util = require('./util');
var path = require('path');
module.exports.action = function(data, callback){
  util.getFileList('./lib/bots',function(files){
    console.log(files);
    files.forEach(function(file){
      if (file.match(/.js$/)){
        var bot = require("./bots/" + file);
        if (typeof bot.action == "function"){
          bot.action(data, callback);
        }
        // for hot deploy
        delete(require.cache[path.resolve("./lib/bots/" + file)]);
      }
    });
  });
};


