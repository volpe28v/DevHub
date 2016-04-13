global.jQuery = require('jquery');
global.$ = global.jQuery;
global.moment = require('moment');
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
        right: 'prev,next today',
        ignoreTimezone: false
      },
      defaultView: 'month',
      defaultDate: viewModel.viewDate,
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
      viewRender: viewModel.viewRender,
      timeFormat: "H:mm",
      height: $(window).height() - 100,
    });
  },
};


function CalendarViewModel(){
  var that = this;

  this.eventText = ko.observable("2016/04/15 2016/04/16 作業タスクだよ\n2016/04/20 2016/04/22 日またがり");
  this.delayedText = ko.pureComputed(this.eventText)
    .extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 200 } });
  this.delayedText.subscribe(function (val) {
    var newEvents = this.textToEvents(val);
    that.events(newEvents);
  }, this);

  this.events = ko.observableArray([]);
  this.viewDate = Date.now();

  this.init = function(){
    var newEvents = this.textToEvents(this.eventText());
    that.events(newEvents);
  }

  this.textToEvents = function(text){
    var events = [];

    text.split("\n").forEach(function(line){
      var found = line.match(/(.+) (.+) (.+)/);
      if (found){
        events.push({
          title: found[3],
          start: moment(found[1]).toDate(),
          end: moment(found[2]).toDate(),
          textColor: 'white',
          allDay: true
        });
      }
    });

    return events;
  }

  this.select = function(startDate, endDate, jsEvent, view){
    var title = prompt("イベント名","");
    if (title != null){
      var events = view.calendar.getEventCache();
      events.push({
        title: title,
        start: moment(startDate),
        end: moment(endDate)
      });

      that.eventText(that.eventsToText(events));
    }
  }
  this.eventClick = function(fcEvent){
    console.log("eventClick: " + fcEvent.id);
    //var event = this.collection.get(fcEvent.id);
    //if ( event == undefined ){ return };
  }

  this.eventDropOrResize = function(fcEvent, delta, revertFunc, jsEvent, ui, view ){
    var text = that.eventsToText(view.calendar.getEventCache());
    that.eventText(text);
  }

  this.viewRender = function(view){
    that.viewDate = view.intervalStart;
  }

  this.eventsToText = function(events){
    var text = "";
    events.sort(function(a,b){
      return a.start > b.start;
    });
    events.forEach(function(event){
      text += that.eventToText(event);
    });
    return text;
  }

  this.eventToText = function(event){
      return event.start.format("YYYY/MM/DD") + " " + event.end.format("YYYY/MM/DD") + " " + event.title + "\n";
  }
}

function CalendarModel(){
  var that = this;
  this.calendarViewModel = new CalendarViewModel();

  this.init = function(){
    that.calendarViewModel.init();
  }

}

$(function() {
  var calendarModel = new CalendarModel();
  ko.applyBindings(calendarModel);
  calendarModel.init();
});
