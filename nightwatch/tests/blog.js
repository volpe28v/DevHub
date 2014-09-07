module.exports = {
  '平文メモを入力' : function (client) {
    client
      .url('http://localhost:3000/blog')
      .waitForElementVisible('#blog_input_form', 1000)

      .setValue('#blog_form', 'hello')
      .click('#save_btn')
      .pause(500)
      .assert.containsText('.blog-body:first-child', 'hello')
  },

  '見出しを入力' : function (client) {
    client
      .setValue('#blog_form', '# header1')
      .click('#save_btn')
      .pause(500)
      .assert.containsText('.blog-body:first-child h1', 'header1')
  },

  '色付き文字を入力' : function (client) {
    client
      .setValue('#blog_form', 'this is red color line. #r')
      .click('#save_btn')
      .pause(500)
      .assert.attributeEquals('.blog-body:first-child .code-out font', 'color', '#ba2636')
      .assert.containsText('.blog-body:first-child .code-out font', 'this is red color line.')
  },

  'チェックボックスを入力' : function (client) {
    client
      .setValue('#blog_form', '-[] this is a task.')
      .click('#save_btn')
      .pause(500)
      .assert.attributeEquals('.blog-body:first-child .code-out input', 'type', 'checkbox')
      .assert.containsText('.blog-body:first-child .code-out', 'this is a task.')
  },

  'Blogテスト終了' : function (client) {
    client
      .end();
  }
};
