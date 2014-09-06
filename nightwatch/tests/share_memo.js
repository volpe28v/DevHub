module.exports = {
  '平文メモを入力' : function (client) {
    client
      .url('http://localhost:3000')
      .waitForElementVisible('#name_in', 1000)
      .pause(1000)
      .click('#login')
      .waitForElementVisible('#message', 1000)
      .click('#share_memo_tab_1')
      .pause(1000)
      .click('#share_memo_1 .sync-text')
      .pause(1000)
      .setValue('#share_memo_1 .code', 'hello')
      .pause(1000)
      .click('#share_memo_1 .fix-text')
      .assert.containsText('#share_memo_1 .code-out', 'hello')
  },
  '見出しを入力' : function (client) {
    client
      .click('#share_memo_1 .sync-text')
      .pause(1000)
      .clearValue('#share_memo_1 .code')
      .setValue('#share_memo_1 .code', '# header1')
      .pause(1000)
      .click('#share_memo_1 .fix-text')
      .assert.containsText('#share_memo_1 .code-out h1', 'header1')
      .end();
  }
};
