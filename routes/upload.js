var fs = require('fs');
exports.post = function(req, res) {
  var tmp_path = req.files.file.path;
  var file_name = req.files.file.name;
  var enc_name = new Buffer(file_name).toString('base64') + "." + file_name.split(".").pop();
  var target_path = './static/uploads/' + enc_name;
  var access_path = '/uploads/' + enc_name;

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
