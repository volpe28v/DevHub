var React = require('react');
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

module.exports = ChatIndex;
