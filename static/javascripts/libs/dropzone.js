function DropZone(param){
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

    $target.show();
    var formData = new FormData();
    formData.append('file', file);

    $.ajax('/upload' , {
      type: 'POST',
      contentType: false,
      processData: false,
      data: formData,
      error: function() {
        $target.hide();
      },
      success: function(res) {
        call_back(context, res);
        $target.hide();
      }
    });
  }
}

module.exports = DropZone;
