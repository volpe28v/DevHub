var React = require('react');

var MemoList = React.createClass({
  render: function(){
    memos = this.props.memos.map(function (memo) {
      return (<Memo memo={memo} key={memo.id}/>);
    });

    return (
      <div className="contents">
      {memos}
      </div>
    )
  }
});

var Memo = React.createClass({
  render: function () {
    if (this.props.memo.is_visible){
      if (this.props.memo.latest){
        return (
          <div>
            <div>{this.props.memo.latest.name} - {this.props.memo.latest.date}</div>
            <pre>{this.props.memo.latest.text}</pre>
          </div>
        );
      }else{
        return (
          <div>
            <div>none</div>
          </div>
        );
      }
    }else{
      if (this.props.memo.latest){
        return (
          <div className="hide">
            <div>{this.props.memo.latest.name} - {this.props.memo.latest.date}</div>
            <pre>{this.props.memo.latest.text}</pre>
          </div>
        );
      }else{
        return (
          <div className="hide">
            <div>none</div>
          </div>
        );
      }
    }
 }
});

module.exports = MemoList;
