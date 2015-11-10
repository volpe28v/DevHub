var React = require('react');

var MemoIndex = React.createClass({
  render: function(){
    var that = this;
    var indexes = this.props.memos.map(function (memo){
      return (<li key={memo.id}><MemoIndexElem memo={memo} onClick={that.props.onClick}/></li>);
    });
    return (
      <div className="memoIndex">
        <ul>
        {indexes}
        </ul>
      </div>
    );
  }
});

var MemoIndexElem = React.createClass({
  _onClick: function(){
    this.props.onClick(this.props.memo.id);
  },

  render: function(){
    if (this.props.memo.latest){
      return (
        <div onClick={this._onClick}>{this.props.memo.latest.name} ({this.props.memo.latest.date})</div>
      );
    }else{
      return (
        <div onClick={this._onClick}>No.{this.props.memo.id}</div>
      );
    }
  }
});

module.exports = MemoIndex;
