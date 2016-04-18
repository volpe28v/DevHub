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

  this.events = ko.observableArray([]);
  this.viewDate = Date.now();

  this.init = function(){
  }

  this.show = function(){
    if (that.el == null){ return; }
    that.el.fullCalendar('render');
  }

  this.setEvents = function(eventsArray){
    var newEvents = this.arrayToEvents(eventsArray);
    that.events(newEvents);
  }

  this.arrayToEvents = function(eventsArray){
    var events = [];

    eventsArray.forEach(function(event){
      var matches = event.body.match(/((\d\d\d\d\/)?((\d{1,2}\/)(\d{1,2})))([ -]+((\d\d\d\d\/)?((\d{1,2}\/)?(\d{1,2}))))?[ ]+(.+)?/);
      if (matches){
        var today = moment();
        var fromYear = matches[2] || today.year() + '/';
        var fromMonth = matches[4];
        var fromDay = matches[5];
        var toYear = matches[8] || fromYear;
        var toMonth = matches[10] || fromMonth;
        var toDay = matches[11] || fromDay;
        var title = matches[12];

        var from = moment(fromYear + fromMonth + fromDay);
        var to = moment(toYear + toMonth + toDay).add(1,'days');

        titleColor = 'gray';
        if (title != null){
          var titleMatches = title.match(/(.+)[ ]+#(.+)/);
          if (titleMatches){
            title = titleMatches[1];
            titleColor = titleMatches[2];

            switch(titleColor){
              case 'r':
                titleColor = '#ba2636';
                break;
              case 'g':
                titleColor = '#387d39';
                break;
              case 'b':
                titleColor = '#333399';
                break;
            }
          }
        }

        events.push({
          id: event.id,
          title: title,
          start: from,
          end: to,
          color: titleColor,
          textColor: 'white',
          editable: false,
          allDay: true
        });
      }

    });

    return events;
  }

  this.select = function(startDate, endDate, jsEvent, view){
    return; // 今のところ新規追加は非対応

    /*
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
    */
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
}

module.exports = CalendarViewModel;
