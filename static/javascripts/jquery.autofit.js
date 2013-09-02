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
    var _autofit = function(el, min_height){
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
          arguments.callee(el, min_height);
        }
      }
    }

    var options = $.extend( defaults, options );

    this.each(function(){
      $(this).css('overflow','hidden');
      var el = $(this).get(0);
      $(this).on('keyup',function(){
        if ($(this).is(':visible')){
          _autofit(el, options.min_height);
        }
      });
    });

    return this;
  }
})(jQuery);

