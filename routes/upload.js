var fs = require('fs');
var util = require('../lib/util');

exports.post = function(req, res) {
  var tmp_path = req.files.file.path;
  var base_name = req.files.file.name.replace(/[ 　]/g,'_');
  // 画像貼り付けの場合は拡張子を付加する
  if (base_name == "blob" && req.files.file.type.indexOf('image') != -1){
    base_name = "paste_image." + req.files.file.type.split('/')[1];
  }
  var file_name = util.getFullDateNoSepa(new Date()) + '_' + base_name; // 半角・全角スペースを置き換え
  var target_path = './static/uploads/' + file_name;
  var access_path = '/uploads/' + file_name;

  fs.rename(tmp_path, target_path, function(err) {
    if (err) {
      throw err;
    }
    fs.unlink(tmp_path, function() {
      if (err) {
        throw err;
      }
      res.send({fileName: access_path});
    });
  });
};

exports.get = function(req, res){
  util.getFileListAndSize('./static/uploads/',function(file_info){
    res.render('upload',{locals:{file_info: file_info}});
  });
};

exports.delete = function(req, res) {
  var path = './static/uploads/' + req.body.file;
  fs.unlink(path, function(err) {
    if (err) {
      throw err;
    }
    util.getFileListAndSize('./static/uploads/',function(file_info){
      res.send({all_size: file_info['all_size']});
    });
  });
};


