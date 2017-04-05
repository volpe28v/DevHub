/*!
 * jQuery AutoFit TextArea Plugin
 *
 */
(function($) {
  $.fn.autofit = function( options ){
    var defaults = {
      min_height: 200
    };

    // private method
    var _autofit = function(that, min_height){
      if (!$(that).is(':visible')){ return; }

      var el = $(that).get(0);
      if(el.scrollHeight > el.offsetHeight){
        el.style.height = el.scrollHeight + 'px';
      } else {
        if (!isNaN(parseInt(el.style.height))){
          while (el.scrollHeight - 50 < parseInt(el.style.height)){
            if ( parseInt(el.style.height) < min_height){
              el.style.height = min_height + 'px';
              el.style.height = el.scrollHeight + 'px';
              return;
            }
            el.style.height = parseInt(el.style.height) - 50 + 'px';
          }
          arguments.callee(that, min_height);
        }
      }
    }

    var options = $.extend( defaults, options );

    this.each(function(){
      $(this).css('overflow','hidden');
      $(this).css('height',options.min_height + 'px');

      _autofit(this, options.min_height);

      $(this).on('keyup',function(event){
        // 処理負荷を軽減するため、Enter時のみ実行する
        // keyCode が undef の場合は明示的に呼ばれた場合とみなす
        if (event.keyCode == undefined || event.keyCode == 13) {
          _autofit(this, options.min_height);
        }
      });
    });

    return this;
  }
})(jQuery);

