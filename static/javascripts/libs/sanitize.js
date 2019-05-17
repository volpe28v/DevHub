(function($) {
  function trimAttributes(node, allowedAttrs) {
    $.each(node.attributes, function() {
      var attrName = this.name;

      if ($.inArray(attrName, allowedAttrs) == -1) {
        $(node).removeAttr(attrName)
      }
    });
  }

  function sanitize(html, whitelist) {
    whitelist = whitelist || {'font': ['color','size'], 'span': ['class', 'title', 'data-bind', 'data-clipboard-text'], 'b': [], 'br': [], 'h1':[], 'h2':[], 'h3':[], 's':[]};
    var output = $('<div>'+html+'</div>');
    output.find('*').each(function() {
      var allowedAttrs = whitelist[this.nodeName.toLowerCase()];
      if(!allowedAttrs) {
        $(this).remove();
      } else {
        trimAttributes(this, allowedAttrs);
      }
    });
    return output.html();
  }

  window.sanitize = sanitize;
})(jQuery);
