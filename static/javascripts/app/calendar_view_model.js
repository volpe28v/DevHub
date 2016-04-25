global.jQuery = require('jquery');
global.$ = global.jQuery;
global.moment = require('moment');
require('fullcalendar');

var ko = require('knockout');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);
var RGBColor = require('rgbcolor');

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

        titleColor = '#666';
        if (title != null){
          var titleMatches = title.match(/(.+)[　 ]+#(.+)/);
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

        var rgbColor = new RGBColor(titleColor);
        events.push({
          id: event.id,
          title: title,
          start: from,
          end: to,
          backgroundColor: 'rgba(' + rgbColor.r + ',' + rgbColor.g + ',' + rgbColor.b + ',0.06)',
          textColor: titleColor,
          borderColor: 'rgba(' + rgbColor.r + ',' + rgbColor.g + ',' + rgbColor.b + ',0.5)',
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
      var start = moment(startDate).format('YYYY/M/D');
      var end = moment(endDate).add(-1,'days').format('YYYY/M/D');

      var eventTitle = "";
      if (start == end){
        eventTitle = start + ' ' + title;
      }else{
        if (startDate.year() == endDate.year()){
          if (startDate.month() == endDate.month()){
            end = moment(endDate).add(-1,'days').format('D');
          }else{
            end = moment(endDate).add(-1,'days').format('M/D');
          }
        }

        eventTitle = start + ' - ' + end + ' ' + title;
      }

      that.options.addEventHandler(eventTitle);
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

  this.eventMouseover = function(fcEvent,jsEvent){
/*
      if (this.isUserEvent(event)){
        // 追加直後のイベントにはフルネームを設定していないためここで判定する(いずれはDBを修正したい)
        $(jsEvent.currentTarget).attr("title", "【" + this.options.user.get('name') + "】 " + event.get('title'));
      }else{
        $(jsEvent.currentTarget).attr("title", "【" + event.get('user') + "】 " + event.get('title'));
      }
      */
  }

  this.viewRender = function(view){
    that.viewDate = view.intervalStart;
  }
}

module.exports = CalendarViewModel;
