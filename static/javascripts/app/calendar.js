global.jQuery = require('jquery');
global.$ = global.jQuery;
var moment = require('moment');
require('fullcalendar');

var ko = require('knockout');
ko.mapping = require('knockout.mapping');

ko.bindingHandlers.fullCalendar = {
  update: function(element, viewModelAccessor) {
    var viewModel = viewModelAccessor();
    element.innerHTML = "";

    $(element).fullCalendar({
      events: ko.utils.unwrapObservable(viewModel.events),
      header: {
        left: 'title',
        center: '',
        right: 'agendaDay, agendaWeek, month prev,next today',
        ignoreTimezone: false
      },
      dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
      dayNamesShort: ['日','月','火','水','木','金','土'],
      titleFormat: {
        month: 'yyyy年 M月',
        week: '[yyyy年 ]M月 d日{ - [yyyy年 ][ M月] d日}',
        day: 'yyyy年 M月 d日 dddd'
      },
      monthNames: [
        '１月','２月','３月','４月','５月','６月',
        '７月','８月','９月','１０月','１１月','１２月'
      ],
      buttonText:{
        today: '今日',
        month: '月',
        week: '週',
        day: '日'
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
  }
};

function CalendarViewModel(){
  var that = this;

  var events = ko.observableArray([

  ]);

  this.init = function(){
  }

  this.select = function(startDate, endDate, allDay){
    console.log("select: " + startDate);

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
  this.calendarViewModel = new CalendarViewModel();

  this.init = function(){
    this.calendarViewModel.init();
  }
}

$(function() {
  var calendarModel = new CalendarModel();
  ko.applyBindings(calendarModel);
  calendarModel.init();
});
