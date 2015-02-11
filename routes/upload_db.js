var fs = require('fs');
var util = require('../lib/util');
var GridFs = require('grid-fs');
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
  var tmp_path = req.files.file.path;
  var file_name = modifyFileName(req.files.file.name, req.files.file.type);
  var access_path = '/uploads/' + file_name;

  var gridFs = new GridFs(db);
  var stream = gridFs.createWriteStream(file_name);
  var source = fs.createReadStream(tmp_path);
  source.pipe(stream);

  stream.on('close', function(){
    fs.unlink(tmp_path, function (err) {
      if (err) {
        throw err;
      }
    });
    res.send({fileName: access_path});
  });
};

var q = require("q");

function getFileInfo(file){
  var deferred = q.defer();
  var gridFs = new GridFs(db);
  gridFs.listFile(file, function(err, info){
    if(err){
      deferred.reject(err);
    }else{
      deferred.resolve({
        name: info.filename,
        size: info.length,
        date: info.uploadDate
      });
    }
  });
  return deferred.promise;
}

function getFileListAndSizeGridFs(){
  var deferred = q.defer();
  var gridFs = new GridFs(db);

  gridFs.list(function(err, files){
    var promises = files.map(function(file){return getFileInfo(file)});
    q.all(promises).then(function(infos){
      var file_info = {
        all_size: infos
            .map(function(info){return info.size})
            .reduce(function(a, b){
              return a + b;
            },0),
        files: infos.sort(function(a,b){ return b['date'] - a['date'] })
      };
      deferred.resolve(file_info);
    });
  });
  return deferred.promise;
}


exports.get = function(req, res){
  getFileListAndSizeGridFs().then(function(file_info){
    res.render('upload',{locals:{file_info: file_info}});
  })
};

exports.delete = function(req, res) {
  var gridFs = new GridFs(db);
  gridFs.unlink(req.body.file, function (err) {
    if (err) {
      throw err;
    }
    getFileListAndSizeGridFs().then(function(file_info){
      res.send({all_size: file_info['all_size']});
    });
  });
};


exports.serve = function(req, res){
  var file = req.param("file");
  var gridFs = new GridFs(db);
  gridFs.list(function(err, files){
    var _ = require("underscore");
    var exists = _.find(files, function(item){return item === file});
    if(exists){
      var stream = gridFs.createReadStream(file);
      stream.pipe(res);
    }else{
      res.status(404);
      res.type('txt').send('Not found');
    }
  });

};

