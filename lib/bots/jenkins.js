var util = require('../util');
var http = require('http');
module.exports.action = function(data, callback){
  if (data.msg.match(/Jenkins/i)){  //自分の名前が呼ばれたら
    // Jenkins の設定
    var jenkins_options = {
      host: 'localhost',
      port: 8080,
      view: 'view1', // view でフィルタしたい場合
    };

    // Jenkins へビルドを依頼
    doJenkins(jenkins_options, data, callback);
  }
};

function doJenkins(jenkins_options, data, callback){
  var get_jobs_path = '/api/json';
  if (jenkins_options.view != undefined && jenkins_options.view != ""){
    get_jobs_path = '/view/' + jenkins_options.view + get_jobs_path;
  }
  var get_jobs_options = {
    host: jenkins_options.host,
    port: jenkins_options.port,
    path: get_jobs_path,
  };

  http.get(get_jobs_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function(chunk){
      var jenkins_info = JSON.parse(chunk);

      var job_list = [];
      var run_job_count = 0;
      jenkins_info.jobs.forEach(function(job){
        job_list.push(job.name);
        var re = new RegExp(job.name, "i");
        if (data.msg.match(re)){
          run_job_count++;
          var build_options = {
            host: jenkins_options.host,
            port: jenkins_options.port,
            path: '/job/' + job.name + '/build',
          };

          http.get(build_options, function(res) {
            var reply = {
              name: "Jenkins",
              msg: "@" + data.name + "さん " + job.name + " のビルドを承りました。",
              interval: 2
            };

            callback(reply);
          });
        }
      });

      if (run_job_count == 0){
        var reply = {
          name: "Jenkins",
          msg: "@" + data.name + "さん 以下のJOBがビルド可能です。<br><font color=red>" + job_list.join(" ") + "</font>",
          interval: 2
        };

        callback(reply);
      }
    });
  }).on('error', function(e) {
    var reply = {
      name: "Jenkins",
      msg: "@" + data.name + "さん Jenkinsサーバでエラーが発生しました。: <br>" + e.message,
      interval: 1
    };

    callback(reply);
    console.log("Got error: " + e.message);
  });
}

