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
      console.log(data.numbers);
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

  handleClick: function(room_id){
    for(var i = 0; i < this.state.chatRooms.length; i++){
      if (this.state.chatRooms[i].id == room_id){
        this.state.chatRooms[i].is_visible = true;
      }else{
        this.state.chatRooms[i].is_visible = false;
      }
    }
    this.setState({chatRooms: this.state.chatRooms});
  },

  render: function() {
    chatLists = this.state.chatRooms.map(function (room) {
      return (<ChatList room={room} />);
    });

    memos = this.state.memos.map(function (memo) {
      return (<Memo memo={memo} />);
    });

    return (
  <div className="container">
    <div className="left">
      <ChatIndex chatRooms={this.state.chatRooms} onClick={this.handleClick}/>
    </div>
    {chatLists}
    {memos}
  </div>
   );
  }
      //<Memo memo={this.state.memo}/>
});

var ChatIndex = React.createClass({
  render: function(){
    var that = this;
    Indexes = this.props.chatRooms.map(function (room) {
      return (<li><ChatIndexElem room={room} onClick={that.props.onClick} /></li>);
    });
    return (
      <div className="chatIndex">
        <ul>
        {Indexes}
        </ul>
      </div>
    );
  }
});

var ChatIndexElem = React.createClass({
  _onClick: function(){
    this.props.onClick(this.props.room.id);
  },

  render: function(){
    if (this.props.room.comments.length > 0){
      return (
        <div onClick={this._onClick}>{this.props.room.name} ({this.props.room.comments[0].date})</div>
      );
    }else{
      return (
        <div onClick={this._onClick}>{this.props.room.name}</div>
      );
    }
  }

});

var ChatRoom = React.createClass({
  render: function(){
    var Lists = this.props.chatRooms.map(function (room) {
      return (<ChatList room={room} />);
    });

    return (
      <div>
      {Lists}
      </div>
    )
  }
});

var ChatList = React.createClass({
  render: function () {
    var Comments = (<div>Loading comments...</div>);
    if (this.props.room) {
      Comments = this.props.room.comments.map(function (comment) {
        return (<ChatComment comment={comment} />);
      });
    }
    if (this.props.room.is_visible){
      return (
        <div className="contents">
          {Comments}
        </div>
      );
    }else{
      return (
        <div className="contents hide">
          {Comments}
        </div>
      );
    }
  }
});

var ChatComment = React.createClass({
  render: function () {
    return (
      <div className="comment">
        <span className="comment-author">{this.props.comment.name}</span>
        <span className="comment-body">{this.props.comment.msg}</span>
      </div>
    );
  }
});

var CommentForm = React.createClass({
  handleSubmit: function (e) {
    e.preventDefault();
    var that = this;
    var author = this.refs.author.getDOMNode().value;
    var text = this.refs.text.getDOMNode().value;
    var comment = { author: author, text: text };
    var submitButton = this.refs.submitButton.getDOMNode();
    submitButton.innerHTML = 'Posting comment...';
    submitButton.setAttribute('disabled', 'disabled');
    this.props.submitComment(comment);

    this.refs.text.getDOMNode().value = '';
    submitButton.innerHTML = 'Post comment';
    submitButton.removeAttribute('disabled');
  },
  render: function () {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input type="text" name="author" ref="author" placeholder="Name" required value={this.props.name} defaultValue="" /><br/>
        <textarea name="text" ref="text" placeholder="Comment" required></textarea><br/>
        <button type="submit" ref="submitButton">Post comment</button>
      </form>
    );
  }
});

var Memo = React.createClass({
  render: function () {
    if (this.props.memo.is_visible){
      if (this.props.memo.latest){
        return (
          <div className="contents">
            <div>{this.props.memo.latest.name} - {this.props.memo.latest.date}</div>
            <pre>{this.props.memo.latest.text}</pre>
          </div>
        );
      }else{
        return (
          <div className="contents">
            <div>none</div>
          </div>
        );
      }
    }else{
      if (this.props.memo.latest){
        return (
          <div className="contents hide">
            <div>{this.props.memo.latest.name} - {this.props.memo.latest.date}</div>
            <pre>{this.props.memo.latest.text}</pre>
          </div>
        );
      }else{
        return (
          <div className="contents hide">
            <div>none</div>
          </div>
        );
      }
    }
 }
});


React.render(
  <DevHub/>,
  document.getElementById('content')
);
