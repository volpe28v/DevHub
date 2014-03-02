var fs = require('fs');
var util = require('../lib/util');

exports.post = function(req, res) {
  var tmp_path = req.files.file.path;
  var file_name = util.getFullDateNoSepa(new Date()) + '_' + req.files.file.name.replace(/[ 　]/g,'_'); // 半角・全角スペースを置き換え
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
