var CommentBox = React.createClass({
  getInitialState: function () {
    return {
      comments: [],
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
    this.socket.on('chat_number', function(number){
      console.log(number.num);
    });

    this.no = 1;
    this.socket.on('latest_log' + this.no, function(comments){
      that.setState({ comments: comments });
    });

    this.socket.on('message_own' + this.no, function(message){
      that.state.comments.unshift(message);
      that.setState({ comments: that.state.comments });
    });

    this.socket.on('message' + this.no, function(message){
      that.state.comments.unshift(message);
      that.setState({ comments: that.state.comments });
    });

    this.socket.emit('latest_log', {room_id: this.no});

    // for memo
    this.socket.on('text' + this.no, function(memo){
      that.setState({ memo: memo });
      console.log(memo);
    });
  },

  submitComment: function (comment, callback) {
    this.socket.emit('message',
      {
        name: comment.author,
        //avatar:avatar,
        room_id: this.no,
        msg: comment.text,
      });
  },
  render: function() {
    return (
  <div className="container">
    <div className="left">
      <div className="commentBox">
        <CommentForm submitComment={this.submitComment}
                     name={this.state.name}/>
        <CommentList comments={this.state.comments}/>
      </div>
    </div>
    <div className="contents">
      <Memo memo={this.state.memo}/>
    </div>
  </div>
   );
  }
});

var CommentList = React.createClass({
  render: function () {
    var Comments = (<div>Loading comments...</div>);
    if (this.props.comments) {
      Comments = this.props.comments.map(function (comment) {
        return (<Comment comment={comment} />);
      });
    }
    return (
      <div className="commentList">
        {Comments}
      </div>
    );
  }
});

var Comment = React.createClass({
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
        <input type="text" name="author" ref="author" placeholder="Name" required value={this.props.name}/><br/>
        <textarea name="text" ref="text" placeholder="Comment" required></textarea><br/>
        <button type="submit" ref="submitButton">Post comment</button>
      </form>
    );
  }
});

var Memo = React.createClass({
  render: function () {
    return (
      <div className="memo">
        <div>{this.props.memo.name} - {this.props.memo.date}</div>
        <pre>{this.props.memo.text}</pre>
      </div>
    );
  }
});


React.render(
  <CommentBox/>,
  document.getElementById('content')
);
