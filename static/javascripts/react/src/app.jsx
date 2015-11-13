var React = require('react');
var ChatIndex = require('./chat_index.jsx');
var ChatRoom = require('./chat_room.jsx');
var MemoIndex= require('./memo_index.jsx');
var MemoList = require('./memo_list.jsx');

var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

var DevHub = React.createClass({
  getInitialState: function () {
    return {
      chatRooms: [],
      currentRoom: null,
      memos: [],
      memo: { text: "" }
    };
  },

  componentDidMount: function () {
    var that = this;
    this.socket = io.connect('/',{query: 'from=devhub'});

    this.socket.on('connect', function() {
      console.log('connect');
      var name = 'React'; //dummy
      that.setState({ name: name });

      that.socket.emit('name',
        {
          name: name,
          avatar: window.localStorage.avatarImage
        });
    });

    this.socket.on('disconnect', function(){
      console.log('disconnect');
    });

    this.socket.on('set_name', function(name) {
      that.setState({ name: name });
      console.log(name);
    });

    // for chat
    var chatHandler = function createChatHandler(room_id){
      return function(){
        that.socket.on('latest_log' + room_id, function(comments){
          that.state.chatRooms[room_id - 1].comments = comments;
          that.setState({ chatRooms: that.state.chatRooms});
        });

        that.socket.on('room_name' + room_id, function(room_name){
          that.state.chatRooms[room_id - 1].name = room_name;;
          that.setState({ chatRooms: that.state.chatRooms});
        });

        that.socket.on('message_own' + room_id, function(message){
          that.state.chatRooms[room_id - 1].comments.unshift(message);
          that.setState({ chatRooms: that.state.chatRooms});
        });

        that.socket.on('message' + room_id, function(message){
          that.state.chatRooms[room_id - 1].comments.unshift(message);
          that.setState({ chatRooms: that.state.chatRooms});
        });
      };
    };

    this.socket.on('chat_number', function(number){
      for (var i = 0; i < number.num; i++){
        var room_id = i + 1;
        that.state.chatRooms[i] = { id: room_id, name: "room" + room_id, is_visible: false, comments: null };

        (chatHandler(room_id))();
        that.socket.emit('latest_log', {room_id: room_id});
        that.socket.emit('room_name', {room_id: room_id});
      }

      that.state.chatRooms[0].is_visible = true;
      that.setState({ chatRooms: that.state.chatRooms});
    });

    // for memo
    var memoHander = function createMemoHandler(memo_id){
      return function(){
        that.socket.on('text' + memo_id, function(memo){
          var memo_no = that.getMemoIndex(memo.no);

          // 最新の変更部分を取得
          if (that.state.memos[memo_no].latest){
            that.state.memos[memo_no].diff = that.getMemoDiff(that.state.memos[memo_no].latest.text, memo.text);
          }else{
            if (that.state.memos[memo_no].logs != null && that.state.memos[memo_no].logs[0] != null){
              var diff = that.getMemoDiff(that.state.memos[memo_no].logs[0].text, memo.text);
              if (diff == ''){
                diff = that.getMemoDiff(that.state.memos[memo_no].logs[1].text, that.state.memos[memo_no].logs[0].text);
              }
              that.state.memos[memo_no].diff = diff;
            }else{
              that.state.memos[memo_no].diff = '';
            }
          }
          that.state.memos[memo_no].latest = memo;
          that.setState({ memos: that.state.memos.sort(function(a,b){
            if ( a.latest == null ) return 1;
            if ( b.latest == null ) return -1;
            if ( a.latest.date > b.latest.date ) return -1;
            if ( a.latest.date < b.latest.date ) return 1;
            return 0;
          })});
        });

        that.socket.on('text_logs' + memo_id, function(logs){
          var memo_no = that.getMemoIndex(logs[0].no);
          that.state.memos[memo_no].logs = logs;

          if (that.state.memos[memo_no].latest != null){
            if (that.state.memos[memo_no].logs[0] != null){
              var diff = that.getMemoDiff(that.state.memos[memo_no].logs[0].text, that.state.memos[memo_no].latest.text);
              if (diff == ''){
                diff = that.getMemoDiff(that.state.memos[memo_no].logs[1].text, that.state.memos[memo_no].logs[0].text);
              }
              that.state.memos[memo_no].diff = diff;
            }
          }
 
          that.setState({ memos: that.state.memos});
        });
      }
    }

    this.socket.on('memo_tab_numbers', function(data){
      for (var i = 0; i < data.numbers.length; i++){
        var memo_id = Number(data.numbers[i]);
        that.state.memos[memo_id] = { id: memo_id, is_visible: false, latest: null };

        (memoHander(memo_id))();
      }

      that.state.memos[Number(data.numbers[0])].is_visible = true;
      that.setState({ memos: that.state.memos});
    });
  },

  getMemoIndex: function(no){
    var that = this;
    var memo_no = 0;
    var empty_no = 0;
    for (var i = 0; i < that.state.memos.length; i++){
      if (that.state.memos[i] == null){ continue; }
      if (that.state.memos[i].latest == null && that.state.memos[i].logs == null){
        empty_no = i;
      }else if (that.state.memos[i].latest != null && that.state.memos[i].latest.no == no){
        memo_no = i;
        break;
      }else if (that.state.memos[i].logs != null && that.state.memos[i].logs[0].no == no){
        memo_no = i;
        break;
      }
    }
    if (memo_no == 0){
      memo_no = empty_no;
    }

    return memo_no;
  },

  getMemoDiff: function(before, after){
    var beforeArray = before.split('\n');
    var afterArray = after.split('\n');

    for (var i = 0; i < beforeArray.length; i++){
      if (beforeArray[i] != afterArray[i]){
        if (i == 0){
          return afterArray[i] + '\n' + afterArray[i+1];
        }else{ 
          return afterArray[i-1] + '\n' + afterArray[i] + '\n' + afterArray[i+1];
        }
      }
    }

    return '';
  },

  submitComment: function (comment, callback) {
    this.socket.emit('message',
      {
        name: comment.author,
        //avatar:avatar,
        room_id: this.state.currentRoom.id,
        msg: comment.text,
      });
  },

  handleChatIndexClick: function(room_id){
    for(var i = 0; i < this.state.chatRooms.length; i++){
      if (this.state.chatRooms[i].id == room_id){
        this.state.chatRooms[i].is_visible = true;
      }else{
        this.state.chatRooms[i].is_visible = false;
      }
    }
    this.setState({chatRooms: this.state.chatRooms});
  },

  handleMemoIndexClick: function(id){
    for(var i = 0; i < this.state.memos.length; i++){
      if (this.state.memos[i] == null){ continue; }
      if (this.state.memos[i].id == id){
        this.state.memos[i].is_visible = true;
      }else{
        this.state.memos[i].is_visible = false;
      }
    }
    this.setState({memos: this.state.memos});
  },

  render: function() {
    return (
  <div className="container">
    <div className="left">
      <ChatIndex chatRooms={this.state.chatRooms} onClick={this.handleChatIndexClick}/>
    </div>
    <ChatRoom rooms={this.state.chatRooms}/>
    <MemoList memos={this.state.memos}/>
  </div>
   );
  }
});

    /*
    <div className="left">
      <MemoIndex memos={this.state.memos} onClick={this.handleMemoIndexClick}/>
    </div>
    */

var ReactDOM = require('react-dom');
ReactDOM.render(
  <DevHub/>,
  document.getElementById('content')
);
