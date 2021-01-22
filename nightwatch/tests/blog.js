module.exports = {
  'Blog画面が表示されること' : function (client) {
    client
      .url('http://localhost:3010/blog')
      .assert.containsText('.brand', 'DevHub Blog 0 blogs.')
  },

  'Blog新規画面が表示されること' : function (client) {
    client
      .click('.icon-plus')
      .assert.containsText('.blog-title-none', 'Blog Title')
  },


  '平文メモを入力' : function (client) {
    client
      .pause(500)
      .clearValue('.edit-area')
      .setValue('.edit-area', 'hello')
      .click('.update-blog')
      .pause(1000)
      .assert.containsText('.blog-body', 'hello')
  },

  '見出しを入力' : function (client) {
    client
      .click('.icon-pencil')
      .pause(500)
      .clearValue('.edit-area')
      .setValue('.edit-area', '# header1')
      .click('.update-blog')
      .pause(500)
      .assert.containsText('.blog-body h1', 'header1')
  },

  '色付き文字を入力' : function (client) {
    client
      .click('.icon-pencil')
      .pause(500)
      .clearValue('.edit-area')
      .setValue('.edit-area', 'this is red color line. #r')
      .click('.update-blog')
      .pause(500)
      .assert.attributeEquals('.blog-body .code-out font', 'color', '#ba2636')
      .assert.containsText('.blog-body', 'this is red color line.')
  },

  'チェックボックスを入力' : function (client) {
    client
      .click('.icon-pencil')
      .pause(500)
      .clearValue('.edit-area')
      .setValue('.edit-area', '-[] this is a task.')
      .click('.update-blog')
      .pause(500)
      .assert.attributeEquals('.blog-body .code-out input', 'type', 'checkbox')
      .assert.containsText('.blog-body', 'this is a task.')
  },

  'Blogテスト終了' : function (client) {
    client
      .end();
  }
};
