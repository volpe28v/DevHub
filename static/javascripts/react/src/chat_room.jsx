var React = require('react');
var List = require('material-ui/lib/lists/list');
var ListDivider = require('material-ui/lib/lists/list-divider');
var ListItem = require('material-ui/lib/lists/list-item');

var Card = require('material-ui/lib/card/card');
var CardHeader = require('material-ui/lib/card/card-header');
var CardText = require('material-ui/lib/card/card-text');
var CardTitle = require('material-ui/lib/card/card-title');


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
  <Card
      className={className}
  >
        {comments}
  </Card>
   );
  }
});

/*
      <List
        className={className}
        subheader={this.props.room.name}>
        {comments}
      </List>
      */
 
var ChatComment = React.createClass({
  render: function () {
    return (
    <CardHeader
      title={this.props.comment.name}
      subtitle={this.props.comment.msg}/>
 
   );
  }
});

/*
      <ListItem
        primaryText={this.props.comment.name}
        secondaryText={
          <p>{this.props.comment.msg}</p>
        }
      />
*/ 
module.exports = ChatRoom;
