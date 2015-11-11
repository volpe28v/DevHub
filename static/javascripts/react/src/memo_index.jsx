var React = require('react');
var RaisedButton = require('material-ui/lib/raised-button');

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
        <RaisedButton label={this.props.memo.latest.name} onClick={this._onClick} secondary={true}/>
      );
    }else{
      var name = "No." + this.props.memo.id;
      return (
        <RaisedButton label={name} onClick={this._onClick}/>
      );
    }
  }
});


        //<div onClick={this._onClick}>{this.props.memo.latest.name} ({this.props.memo.latest.date})</div>
module.exports = MemoIndex;
