global.jQuery = require('jquery');
global.$ = global.jQuery;
global.moment = require('moment');
require('fullcalendar');

var ko = require('knockout');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);

function CalendarViewModel(options){
  var that = this;

  this.el = null;
  this.options = options;

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
    //var newEvents = this.textToEvents(this.eventText());
    //that.events(newEvents);
  }

  this.show = function(){
    if (that.el == null){ return; }
    that.el.fullCalendar('render');
  }

  this.setEvents = function(eventsArray){
    that.eventText(eventsArray);
  }

  this.textToEvents = function(eventsArray){
    var events = [];

    eventsArray.forEach(function(event){
      var found = event.body.match(/(.+) (.+) (.+)/);
      if (found){
        events.push({
          id: event.id,
          title: found[3],
          start: moment(found[1]).toDate(),
          end: moment(found[2]).toDate(),
          textColor: 'white',
          editable: false,
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

      //that.eventText(that.eventsToText(events));
    }
  }
  this.eventClick = function(fcEvent){
    that.options.selectEventHandler(fcEvent.id);
  }

  this.eventDblClick = function(fcEvent){
    that.options.editEventHandler(fcEvent.id);
  }

  this.eventDropOrResize = function(fcEvent, delta, revertFunc, jsEvent, ui, view ){
    //var text = that.eventsToText(view.calendar.getEventCache());
    //that.eventText(text);
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

module.exports = CalendarViewModel;

/*
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
*/
