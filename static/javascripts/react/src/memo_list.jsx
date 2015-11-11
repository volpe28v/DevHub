var React = require('react');
var Card = require('material-ui/lib/card/card');
var CardHeader = require('material-ui/lib/card/card-header');
var CardText = require('material-ui/lib/card/card-text');
var CardTitle = require('material-ui/lib/card/card-title');
var CardActions = require('material-ui/lib/card/card-actions');
var Avatar = require('material-ui/lib/avatar');
var FlatButton= require('material-ui/lib/flat-button');

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
      var title = this.props.memo.latest.text.split('\n')[0];
      var name_date = this.props.memo.latest.date + " - " + this.props.memo.latest.name;
      if (this.props.memo.latest.avatar){
      return (
  <Card
    initiallyExpanded={false} >
    <CardHeader
      title={title}
      subtitle={name_date}
      avatar={<Avatar src={this.props.memo.latest.avatar}/>}
      actAsExpander={true}
      showExpandableButton={true}>
    </CardHeader>
    <CardText expandable={true}>
      <pre>{this.props.memo.latest.text}</pre>
    </CardText>
  </Card>
      );
 
      }else{
        var name = this.props.memo.latest.name.slice(0,1);
      return (
  <Card
    initiallyExpanded={false} >
    <CardHeader
      title={title}
      subtitle={name_date}
      avatar={<Avatar>{name}</Avatar>}
      actAsExpander={true}
      showExpandableButton={true}>
    </CardHeader>
    <CardText expandable={true}>
      <pre>{this.props.memo.latest.text}</pre>
    </CardText>
  </Card>
      );

      }
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

