var React = require('react');
var RaisedButton = require('material-ui/lib/raised-button');

var ChatIndex = React.createClass({
  render: function(){
    var that = this;
    var indexes = this.props.chatRooms.map(function (room) {
      return (<li key={room.id}><ChatIndexElem room={room} onClick={that.props.onClick} /></li>);
    });
    return (
      <div className="chatIndex">
        <ul>
        {indexes}
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
    return (
      <RaisedButton label={this.props.room.name} onClick={this._onClick} primary={true} />
    );
  }
});

module.exports = ChatIndex;
