var fs = require('fs');
exports.post = function(req, res) {
  var target_path, tmp_path;
  tmp_path = req.files.file.path;
  target_path = './static/uploads/' + req.files.file.name;
  access_path = '/uploads/' + req.files.file.name;

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
