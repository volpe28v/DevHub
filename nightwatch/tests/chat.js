module.exports = {
  '平文メッセージを入力' : function (client) {
    client
      .url('http://localhost:3010')
      .waitForElementVisible('#name_in', 1000)
      .pause(1000)
      .click('#login')
      .waitForElementVisible('#message', 1000)
      .setValue('#message', ['hello',client.Keys.ENTER])
      .pause(1000)
      .assert.containsText('#list_1 li:first-child', 'hello')
  },
  'メッセージを削除' : function (client) {
    client.getAttribute('#chat_body li:first-child', 'id', function(result){
      this.click('#chat_body li:first-child .remove_msg');
      this.pause(1000);
      this.assert.elementNotPresent("#" + result.value);
    });
  },
  'URL メッセージを入力' : function (client) {
    client
      .setValue('#message', ['https://github.com/volpe28v/DevHub',client.Keys.ENTER])
      .pause(1000)
      .assert.containsText('#list_1 li:first-child a', 'https://github.com/volpe28v/DevHub')
  },
  '画像 メッセージを入力' : function (client) {
    client
      .setValue('#message', ['http://nightwatchjs.org/img/logo-nightwatch.png',client.Keys.ENTER])
      .pause(1000)
      .assert.attributeEquals('#chat_body li:first-child img', 'src', 'http://nightwatchjs.org/img/logo-nightwatch.png')
  },
  '絵文字 メッセージを入力' : function (client) {
    client
      .setValue('#message', [':dog:',client.Keys.ENTER])
      .pause(1000)
      .assert.attributeEquals('#chat_body li:first-child img', 'src', 'http://localhost:3010/img/emoji/dog.png')
  },

  'チャットテストを終了' : function (client) {
    client
      .end();
  }
};
