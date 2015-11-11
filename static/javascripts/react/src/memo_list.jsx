var React = require('react');
var Card = require('material-ui/lib/card/card');
var CardHeader = require('material-ui/lib/card/card-header');
var CardText = require('material-ui/lib/card/card-text');
var CardTitle = require('material-ui/lib/card/card-title');


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
    var className = '';
    if (!this.props.memo.is_visible){
      className = 'hide';
    }

    if (this.props.memo.latest){
      return (
  <Card
      className={className}
  >
    <CardHeader
      title={this.props.memo.latest.name}
      subtitle={this.props.memo.latest.date}/>
    <CardText>
      <pre>{this.props.memo.latest.text}</pre>
    </CardText>
  
  </Card>
      );
    }else{
      return (
        <div></div>
      );
    }
  }
});

/*
        <div className={className}>
          <div>{this.props.memo.latest.name} - {this.props.memo.latest.date}</div>
          <pre>{this.props.memo.latest.text}</pre>
        </div>
*/ 
module.exports = MemoList;

