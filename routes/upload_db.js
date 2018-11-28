var multiparty = require('multiparty');
var fs = require('fs');
var util = require('../lib/util');
var Grid = require('gridfs-stream');
var mongo = require('mongodb');
var db;

module.exports.set_db = function(current_db){
  db = current_db;
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
    Object.keys(files).forEach(function(name) {
      var org_name = files[name][0].originalFilename;
      var type = files[name][0].headers['content-type'];;
      var file_name = modifyFileName(org_name, type);
      var tmp_path = files[name][0].path;
      var access_path = '/uploads/' + file_name;

      var gfs = Grid(db, mongo);

      var writestream = gfs.createWriteStream({
        filename: file_name
      });
      fs.createReadStream(tmp_path).pipe(writestream);

      writestream.on('close', function (file) {
        fs.unlink(tmp_path, function (err) {
          if (err) {
            throw err;
          }
        });
        res.send({fileName: access_path});
      });

      return;
    });
  });
};

var q = require("q");

function getFileListAndSizeGridFs(){
  var deferred = q.defer();
  var gfs = Grid(db, mongo);
  gfs.files.find().toArray(function (err, files) {
    var file_info = {
      all_size: files 
        .map(function(file){return file.length})
        .reduce(function(a, b){
          return a + b;
        },0),
      files: files
        .map(function(file){
          return {
            name: file.filename,
            size: file.length,
            date: file.uploadDate
          }
        })
        .sort(function(a,b){ return b['date'] - a['date'] })
    };
    deferred.resolve(file_info);
  });
 
  return deferred.promise;
}

exports.get = function(req, res){
  getFileListAndSizeGridFs().then(function(file_info){
    res.render('upload',{file_info: file_info});
  })
};

exports.delete = function(req, res) {
  var gfs = Grid(db, mongo);
  gfs.remove({ filename: req.query.file}, function () {
    getFileListAndSizeGridFs().then(function(file_info){
      res.send({all_size: file_info['all_size']});
    });
  });
};

exports.serve = function(req, res){
  var file = req.params.file;
  var gfs = Grid(db, mongo);

  var readstream = gfs.createReadStream({
    filename: file
  });

  readstream.on('error', function (err) {
    res.status(404);
    res.type('txt').send('Not found');
  });

  readstream.pipe(res);
};

