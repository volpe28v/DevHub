var React = require('react');

var ChatRoom = React.createClass({
  render: function(){
    var lists = this.props.rooms.map(function (room) {
      return (<ChatList room={room} key={room.id}/>);
    });

    return (
      <div className="contents">
      {lists}
      </div>
    )
  }
});

var ChatList = React.createClass({
  render: function () {
    var comments = (<div>Loading comments...</div>);
    if (this.props.room) {
      comments = this.props.room.comments.map(function (comment) {
        return (<ChatComment comment={comment} key={comment._id}/>);
      });
    }
    var className = '';
    if (!this.props.room.is_visible){
      className = 'hide';
    }

    return (
      <div className={className}>
        {comments}
      </div>
    );
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

module.exports = ChatRoom;
