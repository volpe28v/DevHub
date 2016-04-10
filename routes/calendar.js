var util = require('../lib/util');

exports.get = function(req, res){
  var id = req.query.id;
  res.render('calendar');
  //res.render('blog_permalink',{id: id});
};
