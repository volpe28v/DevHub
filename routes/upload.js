var multiparty = require('multiparty');
var fs = require('fs');
var mv = require('mv');
var util = require('../lib/util');

module.exports.set_db = function(current_db){

};

function modifyFileName(file_name, type){
  var base_name = file_name.replace(/[ 　]/g,'_');
  // 画像貼り付けの場合は拡張子を付加する
  if (base_name == "blob" && type.indexOf('image') != -1){
    base_name = "paste_image." + type.split('/')[1];
  }
  return util.getFullDateNoSepa(new Date()) + '_' + base_name; // 半角・全角スペースを置き換え
}

exports.post = function(req, res) {
  var form = new multiparty.Form();

  form.parse(req, function(err, fields, files) {
    if (Object.keys(files).length == 0){
      res.send({fileName: null});
      return;
    }

    Object.keys(files).forEach(function(name) {
      var org_name = files[name][0].originalFilename;
      var type = files[name][0].headers['content-type'];;
      var file_name = modifyFileName(org_name, type);
      var tmp_path = files[name][0].path;
      var target_path = './static/uploads/' + file_name;
      var access_path = '/uploads/' + file_name;

      mv(tmp_path, target_path, function(err) {
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
      return;
    });
  });
};

exports.get = function(req, res){
  util.getFileListAndSize('./static/uploads/',function(file_info){
    res.render('upload',{file_info: file_info});
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

exports.serve = function(req, res){
  res.status(404);
  res.type('txt').send('Not found');
};
