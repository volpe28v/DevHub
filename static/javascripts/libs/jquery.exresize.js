/*
 * 	exResize 0.2.0 - jQuery plugin
 *	written by Cyokodog	
 *
 *	Copyright (c) 2015 Cyokodog (http://d.hatena.ne.jp/cyokodog/)
 *	Dual licensed under the MIT (MIT-LICENSE.txt)
 *	and GPL (GPL-LICENSE.txt) licenses.
 *
 *	Built for jQuery library
 *	http://jquery.com
 *
 */
(function($){
	var API = function(api){
		var api = $(api),api0 = api[0];
		for(var name in api0)
			(function(name){
				if($.isFunction( api0[name] ))
					api[ name ] = (/^get[^a-z]/.test(name)) ?
						function(){
							return api0[name].apply(api0,arguments);
						} : 
						function(){
							var arg = arguments;
							api.each(function(idx){
								var apix = api[idx];
								apix[name].apply(apix,arg);
							})
							return api;
						}
			})(name);
		return api;
	}

	$.ex = $.ex || {};
	$.ex.resize = function(idx , targets , option){
		if ($.isFunction(option)) {
			option = {callback : option};
		}
		var o = this,
		c = o.config = $.extend({} , $.ex.resize.defaults , option);
		c.targets = targets;
		c.target = c.watchTarget = c.targets.eq(idx);
		c.index = idx;

		//c.oldBrowser = $.browser.msie && ($.browser.version < 8.0 || !$.boxModel);
		c.oldBrowser = typeof window.addEventListener == "undefined" && typeof document.querySelectorAll == "undefined";

		c.key = { height : '', width : ''};
		if (c.contentsWatch) {
			o._createContentsWrapper();
		}
		c.currentSize = c.newSize = o.getSize();
		if (c.resizeWatch) o._resizeWatch();
	}
	$.extend($.ex.resize.prototype, {
		_createContentsWrapper : function(){
			var o = this, c = o.config;
			var style = c.oldBrowser ? 'zoom:1;display:inline' : 'display:inline-block';
			c.watchTarget = c.target.wrapInner('<div style="' + style + ';width:' + c.target.css('width') + '"/>').children();
			return o;
		},
		_resizeWatch : function(){
			var o = this, c = o.config;
			setTimeout(function(){
				if (c.contentsWatch) {
					if (c.watchTarget.prev().size() > 0 || c.watchTarget.next().size() > 0 || c.watchTarget.parent().get(0) != c.target.get(0)) {
						c.watchTarget.replaceWith(c.watchTarget.get(0).childNodes);
						o._createContentsWrapper();
					}
				}
				if (o._isResize()) {
					c.currentSize = c.newSize;
					c.callback.call(c.watchTarget.get(0),o);
				}
				o._resizeWatch();
			},c.resizeWatch);
		},
		_isResize : function () {
			var o = this, c = o.config;
			var ret = false;
			c.newSize = o.getSize();
			for (var i in c.key) {
				ret = ret || (c.newSize[i] != c.currentSize[i]);
			}
			return ret;
		},
		getTargets : function(){
			return this.config.targets;
		},
		getTarget : function(){
			return this.config.target;
		},
		getSize : function () {
			var o = this, c = o.config;
			if (c.contentsWatch) c.watchTarget.css('width','auto');
			var ret = {};
			for (var i in c.key) {
				ret[i] = c.watchTarget[i]();
			}
			if (c.contentsWatch) c.watchTarget.css('width',c.target.css('width'));
			return ret;
		}
	});
	$.ex.resize.defaults = {
		contentsWatch : false,
		resizeWatch : 100,
		callback : function(){}
	}
	$.fn.exResize = function(option){
		var targets = this,api = [];
		targets.each(function(idx) {
			var target = targets.eq(idx);
			var obj = target.data('ex-resize') || new $.ex.resize( idx , targets , option);
			api.push(obj);
			target.data('ex-resize',obj);
		});
		return option && option.api ? API(api) : targets;
	}
})(jQuery);
