var React = require('react');
var List = require('material-ui/lib/lists/list');
var ListDivider = require('material-ui/lib/lists/list-divider');
var ListItem = require('material-ui/lib/lists/list-item');
var Avatar = require('material-ui/lib/avatar');

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
      <List
        className={className}
        subheader={this.props.room.name}>
        {comments}
      </List>
   );
  }
});

var ChatComment = React.createClass({
  render: function () {

    var msg = {__html: this.props.comment.msg.replace(/\n/g, '<br/>')};
    if (this.props.comment.avatar){
      return (
        <li>
          <table><tbody><tr><td className='avatar-td'>
            <Avatar src={this.props.comment.avatar} />
          </td><td>
            <div dangerouslySetInnerHTML={msg} />
          </td></tr></tbody></table>
        </li>
      );
    }else{
      var name = '';
      if (this.props.comment.name){
        name = this.props.comment.name.slice(0,1);
      }
      return (
        <li>
          <table><tbody><tr><td className='avatar-td'>
            <Avatar>{name}</Avatar>
          </td><td>
            <div dangerouslySetInnerHTML={msg} />
          </td></tr></tbody></table>
        </li>
      );
    }
  }
});

module.exports = ChatRoom;
