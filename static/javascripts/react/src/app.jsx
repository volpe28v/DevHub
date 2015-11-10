var React = require('react');
var ChatIndex = require('./chat_index.jsx');
var ChatRoom = require('./chat_room.jsx');
var MemoIndex= require('./memo_index.jsx');
var MemoList = require('./memo_list.jsx');

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
    var chatHander = function createChatHandler(room_id){
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
        that.state.chatRooms[i] = { id: room_id, name: "room" + room_id, is_visible: false, comments: [] };

        (chatHander(room_id))();
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
          that.state.memos[memo_id].latest = memo;
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
      <MemoIndex memos={this.state.memos} onClick={this.handleMemoIndexClick}/>
    </div>
    <ChatRoom rooms={this.state.chatRooms}/>
    <MemoList memos={this.state.memos}/>
  </div>
   );
  }
});

var ReactDOM = require('react-dom');
ReactDOM.render(
  <DevHub/>,
  document.getElementById('content')
);
