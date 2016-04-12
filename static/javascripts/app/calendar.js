global.jQuery = require('jquery');
global.$ = global.jQuery;
var moment = require('moment');
require('fullcalendar');

var ko = require('knockout');
ko.mapping = require('knockout.mapping');

ko.fullCalendar = {
  viewModel: function(config) {
    this.header = config.header;
    this.events = config.events;
    this.viewDate = config.viewDate;
    this.select = config.select;
  }
};
ko.bindingHandlers.fullCalendar = {
  update: function(element, viewModelAccessor) {
    console.log('init');
    var viewModel = viewModelAccessor();
    $(element).fullCalendar('destroy');

    $(element).fullCalendar({
      events: ko.utils.unwrapObservable(viewModel.events),
      header: {
        left: 'title',
        center: '',
        right: 'agendaDay, agendaWeek, month prev,next today',
        ignoreTimezone: false
      },
      defaultView: 'month',
      firstHour: 8,
      ignoreTimezone: false,
      selectable: true,
      selectHelper: true,
      editable: true,
      eventTextColor: 'black',
      eventBorderColor: '#aaa',
      select: viewModel.select,
      eventClick: viewModel.eventClick,
      eventDrop: viewModel.eventDropOrResize,
      eventResize: viewModel.eventDropOrResize,
      eventMouseover: viewModel.eventMouseover,
      eventMouseout: viewModel.eventMouseout,
      eventAfterRender: viewModel.applyCheckEvents,
      eventAfterAllRender: viewModel.eventAfterAllRender,
      timeFormat: "H:mm",
      height: $(window).height() - 10,
    });
    $(element).fullCalendar('gotoDate', ko.utils.unwrapObservable(viewModel.viewDate));
  },
};


function CalendarViewModel(){
  var that = this;

  this.eventText = ko.observable("2016/04/15 2016/04/16 作業タスクだよ\n2016/04/20 2016/04/22 日またがり");
  this.delayedText = ko.pureComputed(this.eventText)
    .extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 500 } });
  this.delayedText.subscribe(function (val) {
    var newEvents = this.textToEvents(val);
    that.events(newEvents);
  }, this);

  this.events = ko.observableArray([
    {title: 'All Day Event', start: Date.now() ,allDay: true}
  ]);
  this.viewDate = ko.observable(Date.now());

  this.init = function(){
    //that.events.push({title: 'All Day Event',start: new Date(),allDay: true});

    //var eventText = "2016/04/15 2016/04/16 作業タスクだよ\n2016/04/20 2016/04/22 日またがり";

    var newEvents = this.textToEvents(this.eventText());
    that.events(newEvents);
  }

  this.textToEvents = function(text){
    var events = [];

    text.split("\n").forEach(function(line){
      var found = line.match(/(.+) (.+) (.+)/);
        console.log(found);
      if (found){
        events.push({
          title: found[3],
          start: moment(found[1]).toDate(),
          end: moment(found[2]).toDate(),
          allDay: true
        });
      }
    });

    return events;
  }

  this.select = function(startDate, endDate, allDay){
    console.log("select: " + startDate);
    that.events.push({
      title: 'All Day Event',
      start: startDate,
      allDay: true
    });
  }
  this.eventClick = function(fcEvent){
    console.log("eventClick: " + fcEvent.id);
    //var event = this.collection.get(fcEvent.id);
    //if ( event == undefined ){ return };
  }
  this.eventDropOrResize = function(fcEvent){
    console.log("eventDropOrResize: " + fcEvent.id);
    /*
    var event = this.collection.get(fcEvent.id);
    if ( event == undefined ){ return };
    if ( fcEvent.end == null ){ fcEvent.end = fcEvent.start; }
    event.save({start: fcEvent.start, end: fcEvent.end, allDay: fcEvent.allDay});
    */
  }
}

function CalendarModel(){
  var that = this;
  this.calendarViewModel = new CalendarViewModel();
  //this.calendarViewModel = new ko.fullCalendar.viewModel(this.calendarViewModelIns);

  this.init = function(){
    that.calendarViewModel.init();
  }

}

$(function() {
  var calendarModel = new CalendarModel();
  ko.applyBindings(calendarModel);
  calendarModel.init();
});
