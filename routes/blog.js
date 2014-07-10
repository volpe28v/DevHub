var mongo = require('mongodb');
var util = require('../lib/util');
var db;

var table_log_name = 'text_log';
var table_latest_text_name = 'latest_text';

exports.set_db = function(current_db){
  db = current_db;
};

exports.post = function(req, res) {
};

exports.get = function(req, res){
  res.render('blog');
};

exports.get_body = function(req, res){
  db.collection(table_latest_text_name, function(err, collection) {
    collection.find().toArray(function(err, latest_texts) {
      var blogs = [];
      if (latest_texts != null && latest_texts.length != 0){
        blogs = latest_texts;
      }
      res.send({body: blogs});
    });
  });
};

exports.delete = function(req, res) {
};


