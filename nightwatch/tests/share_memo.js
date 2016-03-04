module.exports = {
  '平文メモを入力' : function (client) {
    client
      .url('http://localhost:3010')
      .waitForElementVisible('#name_in', 1000)
      .click('#login')
      .waitForElementVisible('#message', 1000)
      .click('#share_memo_tab_1')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500) // フォーカスが落ち着くまで待つ
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'hello')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.containsText('#share_memo_1 .code-out', 'hello')
  },

  '見出しを入力' : function (client) {
    client
      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '# header1')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.containsText('#share_memo_1 .code-out h1', 'header1')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '## header2')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.containsText('#share_memo_1 .code-out h2', 'header2')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '### header3')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.containsText('#share_memo_1 .code-out h3', 'header3')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '#### header4\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.containsText('#share_memo_1 .code-out h4', 'header4')
  },

  '色付き文字を入力' : function (client) {
    client
      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'this is red color line. #r\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.attributeEquals('#share_memo_1 .code-out font', 'color', '#ba2636')
      .assert.containsText('#share_memo_1 .code-out font', 'this is red color line.')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'this is blue color line. #b\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.attributeEquals('#share_memo_1 .code-out font', 'color', '#333399')
      .assert.containsText('#share_memo_1 .code-out font', 'this is blue color line.')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'this is green color line. #g\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.attributeEquals('#share_memo_1 .code-out font', 'color', '#387d39')
      .assert.containsText('#share_memo_1 .code-out font', 'this is green color line.')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'this is other color line. #112233\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.attributeEquals('#share_memo_1 .code-out font', 'color', '#112233')
      .assert.containsText('#share_memo_1 .code-out font', 'this is other color line.')
  },

  'チェックボックスを入力' : function (client) {
    client
      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '-[] this is a task.\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.attributeEquals('#share_memo_1 .code-out input', 'type', 'checkbox')
      .assert.containsText('#share_memo_1 .code-out', 'this is a task.')
  },

  'コードを入力' : function (client) {
    client
      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '```\n')
      .setValue('#share_memo_1 .code', 'this is a code.\n')
      .setValue('#share_memo_1 .code', '```\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.containsText('#share_memo_1 .code-out .code-out-pre', 'this is a code.')
  },

  'URLを入力' : function (client) {
    client
      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'https://github.com/volpe28v/DevHub\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.containsText('#share_memo_1 .code-out a', 'https://github.com/volpe28v/DevHub')
  },

  '画像を入力' : function (client) {
    client
      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'http://nightwatchjs.org/img/logo-nightwatch.png\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .pause(500)
      .assert.attributeEquals('#share_memo_1 img', 'src', 'http://nightwatchjs.org/img/logo-nightwatch.png')
  },

  'メモ2に画像を入力' : function (client) {
    client
      .click('#share_memo_tab_2')
      .click('#share_memo_2 .sync-text')
      .waitForElementVisible('#share_memo_2 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_2 .code')
      .setValue('#share_memo_2 .code', 'http://nightwatchjs.org/img/logo-nightwatch.png\n')
      .click('#share_memo_2 .fix-text')
      .waitForElementVisible('#share_memo_2 .code-out', 1000)
      .pause(500)
      .assert.attributeEquals('#share_memo_2 img', 'src', 'http://nightwatchjs.org/img/logo-nightwatch.png')
  },

  'メモ2が編集状態でメモ1に移動して戻ってきたら閲覧モードになる' : function (client) {
    client
      .click('#share_memo_tab_2')
      .click('#share_memo_2 .sync-text')
      .waitForElementVisible('#share_memo_2 .code', 1000)
      .pause(500)
      .click('#share_memo_tab_1')
      .click('#share_memo_tab_2')
      .waitForElementVisible('#share_memo_2 .code-out', 1000)
  },

  'メモ2が編集状態でDiffボタンを押下したら閲覧モードになる' : function (client) {
    client
      .click('#share_memo_tab_2')
      .click('#share_memo_2 .sync-text')
      .waitForElementVisible('#share_memo_2 .code', 1000)
      .pause(500)
      .click('#share_memo_2 .diff-button')
      .waitForElementVisible('#share_memo_2 .code-out', 1000)
  },


  'メモ1をクリア' : function (client) {
    client
      .click('#share_memo_tab_1')
      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
  },

  'メモ2をクリア' : function (client) {
    client
      .click('#share_memo_tab_2')
      .click('#share_memo_2 .sync-text')
      .waitForElementVisible('#share_memo_2 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_2 .code')
      .click('#share_memo_2 .fix-text')
      .waitForElementVisible('#share_memo_2 .code-out', 1000)
  },


  '共有メモテスト終了' : function (client) {
    client
      .end();
  }
};
