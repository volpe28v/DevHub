module.exports = {
  '平文メモを入力' : function (client) {
    client
      .url('http://localhost:3000')
      .waitForElementVisible('#name_in', 1000)
      .click('#login')
      .waitForElementVisible('#message', 1000)
      .click('#share_memo_tab_1')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500) // フォーカスが落ち着くまで待つ
      .setValue('#share_memo_1 .code', 'hello')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
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
      .assert.containsText('#share_memo_1 .code-out h1', 'header1')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '## header2')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .assert.containsText('#share_memo_1 .code-out h2', 'header2')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '### header3')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .assert.containsText('#share_memo_1 .code-out h3', 'header3')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '#### header4\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
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
      .assert.attributeEquals('#share_memo_1 .code-out font', 'color', '#ba2636')
      .assert.containsText('#share_memo_1 .code-out font', 'this is red color line.')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'this is blue color line. #b\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .assert.attributeEquals('#share_memo_1 .code-out font', 'color', '#333399')
      .assert.containsText('#share_memo_1 .code-out font', 'this is blue color line.')

      .click('#share_memo_1 .sync-text')
      .waitForElementVisible('#share_memo_1 .code', 1000)
      .pause(500)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', 'this is green color line. #g\n')
      .click('#share_memo_1 .fix-text')
      .waitForElementVisible('#share_memo_1 .code-out', 1000)
      .assert.attributeEquals('#share_memo_1 .code-out font', 'color', '#387d39')
      .assert.containsText('#share_memo_1 .code-out font', 'this is green color line.')


      .end();
  }
};
