function DropZone(param){
  if(!window.FileReader) {
    show_share_memo_alert(param.alertTarget, 'Drop file', 'This browser does not support dropping files.');
    return false;
  }

  param.dropTarget.bind("dragenter", this.cancel_event);
  param.dropTarget.bind("dragover", this.cancel_event);

  if (param.dropChildSelector == undefined){
    param.dropTarget.on('drop', this.drop_file_action(param.alertTarget, param.uploadedAction));
  }else{
    // 子要素指定がある場合は子要素それぞれをバインドする
    param.dropTarget.on('drop', param.dropChildSelector, this.drop_file_action(param.alertTarget, param.uploadedAction));
  }

  if (param.fileTarget != undefined){
    param.fileTarget.on('change', this.select_file_action(param.alertTarget, param.uploadedAction));
  }

  // 画像貼り付け時
  if(param.pasteValid){
    param.dropTarget.on('paste', this.paste_file_action(param.alertTarget, param.uploadedAction));
  }
}

DropZone.prototype = {
 drop_file_action: function($target, call_back){
    var that = this;
    return function(event){
      var context = this;
      var file = event.originalEvent.dataTransfer.files[0];

      that.upload_file_with_ajax(context, file, $target, call_back);
      return false;
    }
  },

  select_file_action: function($target, call_back){
    var that = this;
    return function(event){
      var context = this;
      var file = $(context).prop('files')[0];

      that.upload_file_with_ajax(context, file, $target, call_back);
      return false;
    }
  },

  paste_file_action: function($target, call_back){
    var that = this;
    return function(event){
      var context = this;
      var items = event.originalEvent.clipboardData.items;
      for (var i = 0 ; i < items.length ; i++) {
        var item = items[i];
        if (item.type.indexOf("image") != -1) {
          var file = item.getAsFile();
          file.name = "paste." + item.type.split("/")[1];

          that.upload_file_with_ajax(context, file, $target, call_back);
        }
      }
      return true;
    }
  },
 
  cancel_event: function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  },
 
  upload_file_with_ajax: function(context, file, $target, call_back){
    var that = this;
    var $alert = this.show_share_memo_uploading($target, 'Uploading', 'now uploading "' + file.name + '" ... ');

    var formData = new FormData();
    formData.append('file', file);

    $.ajax('/upload' , {
      type: 'POST',
      contentType: false,
      processData: false,
      data: formData,
      error: function() {
        that.hide_share_memo_alert($alert);
        that.show_share_memo_alert($target, 'Drop error', 'failed to file upload.');
      },
      success: function(res) {
        that.hide_share_memo_alert($alert);
        call_back(context, res);
      }
    });
  },

  show_share_memo_alert: function($target, title, text){
    var $alert = $('<div>').addClass('share-memo-alert alert alert-error').css('display','none')
      .html('<a class="close" data-dismiss="alert">x</a><strong>' + title + '</strong> ' + text )
      .prependTo($target)
      .slideDown('normal', function(){
        var that = this;
        setTimeout(function(){
          if ($(that)){
            $(that).slideUp('normal',function(){
              $(this).remove();
            });
          }
        }, 10000);
      });
  },

  show_share_memo_uploading: function($target, title, text){
    return $alert = $('<div>').addClass('share-memo-alert alert alert-info').css('display','none')
      .html('<a class="close" data-dismiss="alert">x</a><strong>' + title + '</strong> ' + text )
      .prependTo($target)
      .slideDown('normal');
  },

  hide_share_memo_alert: function($alert){
    $alert.slideUp('normal',function(){
      $(this).remove();
    });
  }
}
