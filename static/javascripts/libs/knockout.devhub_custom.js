global.jQuery = require('jquery');
global.$ = global.jQuery;
require('jquery-ui');
require('bootstrap');
require('./jquery.autofit');
require('./jquery.caret');
require('./jquery.decora');
require('jquery-textcomplete');
require('jquery-inview');
require('../libs/jquery.exresize');

var emojify = require('emojify.js');
var emojies = require('../libs/emojies.js');

emojify.setConfig({
  img_dir: 'img/emoji',  // Directory for emoji images
});

var DropZone = require('./dropzone');

function addCustomBindingHandlers(ko){
  ko.bindingHandlers.decoBlogHtml = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            return { 'controlsDescendantBindings': true };
          },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
              $(element).showDecora(ko.unwrap(valueAccessor()));
            }
  }

  ko.bindingHandlers.decoBlogTitleHtml = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            return { 'controlsDescendantBindings': true };
          },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
              $(element).html(ko.unwrap(valueAccessor()));
              emojify.run(element);
              ko.applyBindingsToDescendants(bindingContext, element);
            }
  }

  ko.bindingHandlers.decoHtml = {
    init: function() {
            return { 'controlsDescendantBindings': true };
          },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
              $(element).showDecora(ko.unwrap(valueAccessor()));
              ko.applyBindingsToDescendants(bindingContext, element);
            }
  };

  ko.bindingHandlers.decoMemoTitle = {
    init: function() {
            return { 'controlsDescendantBindings': true };
          },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
              $(element).html(ko.unwrap(valueAccessor()));
              emojify.run(element);
              ko.applyBindingsToDescendants(bindingContext, element);
            }
  };

  ko.bindingHandlers.decoMemoIndex = {
    init: function() {
            return { 'controlsDescendantBindings': true };
          },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
              $(element).html(ko.unwrap(valueAccessor()));
              emojify.run(element);
            }
  };

  ko.bindingHandlers.decoHtmlMsg = {
    init: function() {
            return { 'controlsDescendantBindings': true };
          },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
              $(element).html(valueAccessor());
              ko.applyBindingsToDescendants(bindingContext, element);
            }
  }

  ko.bindingHandlers.tooltip = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            $(element).tooltip({placement: valueAccessor()});
          }
  }

  ko.bindingHandlers.editStartTextarea = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
              var value = valueAccessor();
              var valueUnwrapped = ko.unwrap(value);

              if (valueUnwrapped == true){
                $(element).caretLine(0);
                $(element).autofit({min_height: 100});
              }
            }
  }

  // autofit カスタムバインディング(true の場合に有効)
  ko.bindingHandlers.autofit = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            if (valueAccessor()){
              $(element).autofit({min_height: 700});
            }
          }
  }

  // DropZone カスタムバインディング(true の場合に有効)
  ko.bindingHandlers.dropzoneDisp = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            if (!valueAccessor()){ return }

            var viewModel = bindingContext.$data;

            // 閲覧モードの行指定でドロップ
            new DropZone({
              dropTarget: $(element),
                dropChildSelector: '.code-out-tr',
                alertTarget: $('#loading'),
                uploadedAction: function(context, res){
                  if (res.fileName == null){ return; }
                  var row = $(context).closest("table").find("tr").index(context);

                  // ドロップ位置にファイルを差し込む
                  viewModel.insert(row + 1, res.fileName + " ");
                }
            });

            // 閲覧モードの行以外の部分にドロップ
            new DropZone({
              dropTarget: $(element),
                alertTarget: $('#loading'),
                uploadedAction: function(context, res){
                  if (res.fileName == null){ return; }

                  // メモの先頭に画像を差し込む
                  viewModel.insert(0, res.fileName + " ");
                }
            });
          }
  }

  ko.bindingHandlers.dropzoneEdit= {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            if (!valueAccessor()){ return }

            var viewModel = bindingContext.$data;

            // 編集モードへのドロップ
            new DropZone({
              dropTarget: $(element),
                alertTarget: $('#loading'),
                pasteValid: true,
                uploadedAction: function(context, res){
                  if (res.fileName == null){ return; }
                  var row = $(context).caretLine();

                  // メモのキャレット位置にファイルを差し込む
                  viewModel.insert(row - 1, res.fileName + " ");
                  $(context).caretLine(row);
                }
            });
          }
  }

  ko.bindingHandlers.decora = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            if (!valueAccessor()){ return }

            var viewModel = bindingContext.$data;

            $(element)
              .decora({
                checkbox_callback: function(context, applyCheckStatus){
                  // チェック対象のテキストを更新する
                  viewModel.applyToWritingText(applyCheckStatus);
                },
                img_size_callback: function(context, applyImgSize){
                  // チェック対象のテキストを更新する
                  viewModel.applyToWritingText(applyImgSize);
                }
              });
          }
  }

  ko.bindingHandlers.fullCalendar = {
    update: function(element, viewModelAccessor) {
              var viewModel = viewModelAccessor();
              viewModel.el = $(element);
              $(element).fullCalendar('destroy');

              $(element).fullCalendar({
                events: ko.utils.unwrapObservable(viewModel.events),
                header: {
                  left: '',
                center: 'title',
                right: 'prev,next today',
                ignoreTimezone: false
                },
                views: {
                         month: {
                                  titleFormat: 'YYYY/M'
                                }
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
                height: $(window).height() - 65,
                eventRender: function(event, element) {
                  $(element).attr('data-original-title', event.title).tooltip({placement: 'bottom'});
                  emojify.run($(element[0]).find(".fc-title").get(0));
                  element.bind('dblclick', function() {
                    viewModel.eventDblClick(event, element);
                  });
                }
              });
    },
  };

  ko.bindingHandlers.inview = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            if (valueAccessor()){
              var viewModel = bindingContext.$data;

              $(element).on('inview', 'li:last-child', function(event, isInView, visiblePartX, visiblePartY) {
                // ログ追加読み込みイベント
                if (!isInView){ return false; }

                var data = ko.dataFor(this);
                viewModel.load_log_more(data._id);
              });
            }
          }
  }

  // textcomplete カスタムバインディング(true の場合に有効)
  ko.bindingHandlers.textcomplete = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      if (valueAccessor()){
        $(element).textcomplete([{
          match: /\B:([\-+\w]*)$/,
          search: function (term, callback) {
            callback($.map(emojies, function (emoji) {
              return emoji.indexOf(term) === 0 ? emoji : null;
            }));
          },
          template: function (value) {
            return '<img class="emoji-suggest" src="img/emoji/' + value + '.png"></img> ' + value;
          },
          replace: function (value) {
            return ' :' + value + ':';
          },
          index: 1,
          maxCount: 8
        }]);
      }
    }
  }

  // autosize カスタムバインディング(true の場合に有効)
  ko.bindingHandlers.autosize = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      if (valueAccessor()){
        $(element).autosize();
      }
    }
  }
 
  // sortable カスタムバインディング
  ko.bindingHandlers.sortable = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      if (!valueAccessor()){ return }

      var viewModel = bindingContext.$data;

      $(element).sortable({
        placeholder: 'draggable-placeholder',
        revert: true,
        tolerance: "pointer",
        distance: 20,
        forcePlaceholderSize: true,
        scroll: false,
        start: function(event,ui){
          viewModel.startTabMoving();
        },
        stop: function(event,ui){
          var tabs = $(this).sortable('toArray');
          viewModel.stopTabMoving(tabs);
        }
      });
    }
  }

  // sortableMemo カスタムバインディング
  ko.bindingHandlers.sortableMemo = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      var params = valueAccessor();
      var viewModel = bindingContext.$data;

      $(element).sortable({
        items: params.items,
        cancel: params.cancel,
        distance: 6,
        start: function(event,ui){
          ui.placeholder.height(ui.helper.outerHeight());
          viewModel.startMemoMoving(ui);
        },
        stop: function(event,ui){
          viewModel.stopMemoMoving(ui);
        },
        helper: function(e, tr){
          var $originals = tr.children();
          var $helper = tr.clone();
          $helper.children().each(function(index)
          {
            $(this).width($originals.eq(index).width());
          });
          return $helper;
        },
        placeholder: 'draggable-placeholder',
        tolerance: 'pointer',
        revert: true,
        axis: "y",
        opacity: 0.5,
        scroll: true
      });
    }
  }
}


module.exports = addCustomBindingHandlers;


