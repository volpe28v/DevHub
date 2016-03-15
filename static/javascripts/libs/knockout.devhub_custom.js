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


