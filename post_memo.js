var host = 'http://localhost:3002/',
    request = require('request'),
    params = process.argv.slice(2);


var name = params[0];
var msg = params[1];

var item = { name: name, msg: msg };
request.post(host + 'notify_memo', {form: item}, function(error, response, body) {
  if (error) {
    console.log("error");
  }
});

console.log("Post: ", item);
