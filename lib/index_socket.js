var chat_log = require('./chat_log');
var text_log = require('./text_log');
var bots = require('./bots');
var client_info = require('./client_info');
var util = require('./util');

module.exports.setup = function(io){
  io.sockets.on('connection', function(client) {
    var client_ip = client_info.get_ip(client);
    console.log("New Connection from " + client_ip);

    client_info.login(client_ip);

    function load_latest_text(number){
      for( var i = 1; i <= number; i++){
        text_log.get_logs_by_no(i, function(logs){
          client.emit('text_logs_with_no', logs);
        });
      }

      text_log.get_latest(number, function(latest_texts){
        var length = latest_texts.length;
        for( var i = 0; i < length; i++){
          client.emit('text',latest_texts[i]);
        }
      });
    }

    text_log.get_active_number(function(number){
      client.emit('memo_number',number);
      load_latest_text(number.num);
    });

    function load_latest_log(){
      chat_log.size(function(size){
        if ( size > 0 ){
          chat_log.get(function(logs){
            client.emit('latest_log',logs);
          });
        }else{
          client.emit('latest_log',[]);
        }
      });
    }

    client.on('name', function(data) {
      client_info.set_name(client, data);
      if (data.name == null || data.name == ""){
        client.emit('set_name', client_info.get_name(client));
      }

      var list = client_info.list();
      client.emit('list', list);
      client.broadcast.emit('list', list);

      load_latest_log();
    });

    client.on('latest_log', function(data) {
      load_latest_log();
    });

    client.on('message', function(data) {
      if(client_info.set_name(client, data)){
        client.emit('list', client_info.list());
        client.broadcast.emit('list', client_info.list());
      }

      data.date = util.getFullDate(new Date());

      chat_log.add(data);
      client.emit('message_own', data);
      client.broadcast.emit('message', data);
      client_info.send_growl_without(client, data);

      // for bot
      bots.action(data, function(reply){
        setTimeout(function(){
          reply.date = util.getFullDate(new Date());
          chat_log.add(reply);
          client.emit('message_own', reply);
          client.broadcast.emit('message', reply);
          client_info.send_growl_without(client, reply);
        },reply.interval * 1000);
      });
    });

    client.on('remove_message', function(data) {
      client.broadcast.emit('remove_message', data);
      chat_log.remove(data.id);
    });

    client.on('load_log_more', function(data) {
      chat_log.get_older(data.id, function(logs){
        client.emit('latest_log',logs);
      });
    });

    client.on('pomo', function(pomo_data){
      client_info.set_name(client, pomo_data);
      var pomo_msg = ""
      if ( pomo_data.msg != "" ){
        pomo_msg = '「' + pomo_data.msg + '」'
      }

    if ( client_info.is_pomo(client) ){
      client_info.set_pomo(client,false);
    }else{
      client_info.set_pomo(client,true,setInterval(function(){
        var current_min = client_info.update_pomo(client, 1);

        if (current_min <= 0 ){
          var data = {name: "Pomo", date: util.getFullDate(new Date()), msg: client_info.get_name(client) + "さんのポモドーロが終了しました。"};
          client_info.set_pomo(client,false);
          client_info.send_growl_to(client,data);
        }

        client.emit('list', client_info.list());
        client.broadcast.emit('list', client_info.list());
      }, 1 * 60000));
    }

    client.emit('list', client_info.list());
    client.broadcast.emit('list', client_info.list());
    });

    client.on('text', function(msg) {
      var name = client_info.get_name(client)
      msg.text = msg.text.replace(/\n/g,"\r\n");

    // [ref]が存在したらIDを追加する
    var ref_count = 0;
    msg.text = msg.text.replace(/\[ref\]/g,
      function(){
        return "[ref:" + String(msg.no) + "-" + new Date().getTime() + String(ref_count++) + "]";
      });

    var current_text_log = { name: name, no: msg.no, text: msg.text, date: util.getFullDate(new Date()) }

    client.emit('text', current_text_log);
    client.broadcast.emit('text', current_text_log);

    text_log.update_latest_text(current_text_log);
    });

    client.on('add_history', function(msg) {
      text_log.add_history(msg.no, function(result){
        text_log.get_logs_by_no(msg.no, function(logs){
          client.emit('text_logs_with_no', logs);
          client.broadcast.emit('text_logs_with_no', logs);
        });
      });
    });

    client.on('memo_number', function(data) {
      client.emit('memo_number', data);
      client.broadcast.emit('memo_number', data);
      load_latest_text(data.num);
      text_log.update_active_number(data);
    });

    client.on('disconnect', function() {
      client_info.set_pomo(client,false);
      var client_addr = client_info.get_ip(client);

      if( client_info.logout(client) ){
        client.broadcast.emit('list', client_info.list());
      }

      console.log('disconnect:' + client_info.get_ip(client));
    });
  });
}

