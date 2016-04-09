module.exports = {
  'Blog画面が表示されること' : function (client) {
    client
      .url('http://localhost:3010/blog')
      .assert.containsText('.brand', 'DevHub - 0 blog')
  },

  '平文メモを入力' : function (client) {
    client
      .setValue('#blog_form', 'hello')
      .click('#save_btn')
      .pause(1000)
      .assert.containsText('.blog-body:first-child', 'hello')
      .assert.containsText('.index-body:first-child', 'hello')
  },

  '見出しを入力' : function (client) {
    client
      .setValue('#blog_form', '# header1')
      .click('#save_btn')
      .pause(500)
      .assert.containsText('.blog-body:first-child h1', 'header1')
      .assert.containsText('.index-body:first-child', 'header1')
  },

  '色付き文字を入力' : function (client) {
    client
      .setValue('#blog_form', 'this is red color line. #r')
      .click('#save_btn')
      .pause(500)
      .assert.attributeEquals('.blog-body:first-child .code-out font', 'color', '#ba2636')
      .assert.containsText('.index-body:first-child', 'this is red color line.')
  },

  'チェックボックスを入力' : function (client) {
    client
      .setValue('#blog_form', '-[] this is a task.')
      .click('#save_btn')
      .pause(500)
      .assert.attributeEquals('.blog-body:first-child .code-out input', 'type', 'checkbox')
      .assert.containsText('.index-body:first-child', 'this is a task.')
  },

  'Blogテスト終了' : function (client) {
    client
      .end();
  }
};
