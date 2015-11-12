var React = require('react');
var List = require('material-ui/lib/lists/list');
var ListItem = require('material-ui/lib/lists/list-item');

var ChatIndex = React.createClass({
  render: function(){
    var that = this;
    var indexes = this.props.chatRooms.map(function (room) {
      return (<ChatIndexElem key={room.id} room={room} onClick={that.props.onClick} />);
    });
    return (
      <List>
        {indexes}
      </List>
    );
  }
});

var ChatIndexElem = React.createClass({
  _onClick: function(){
    this.props.onClick(this.props.room.id);
  },

  render: function(){
    return (
      <ListItem primaryText={this.props.room.name} onClick={this._onClick} />
    );
  }
});

module.exports = ChatIndex;
