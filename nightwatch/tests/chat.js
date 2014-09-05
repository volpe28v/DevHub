module.exports = {
  tags: ['chat'],
  '平文メッセージを入力' : function (client) {
    client
      .url('http://localhost:3000')
      .waitForElementVisible('#name_in', 1000)
      .pause(1000)
      .click('#login')
      .waitForElementVisible('#message', 1000)
      .setValue('#message', ['hello',client.Keys.ENTER])
      .pause(1000)
      .assert.containsText('#chat_body', 'hello')
      .click('.remove_msg')
      .pause(1000)
      .assert.hidden("#list li")
      .end();
  },
  'URL メッセージを入力' : function (client) {
    client
      .url('http://localhost:3000')
      .waitForElementVisible('#name_in', 1000)
      .pause(1000)
      .click('#login')
      .waitForElementVisible('#message', 1000)
      .setValue('#message', ['https://github.com/volpe28v/DevHub',client.Keys.ENTER])
      .pause(1000)
      .assert.containsText('#chat_body a', 'https://github.com/volpe28v/DevHub')
      .end();
  }
};
