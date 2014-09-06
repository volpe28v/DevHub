module.exports = {
  '名前指定ログイン' : function (client) {
    client
      .url('http://localhost:3000')
      .waitForElementVisible('#name_in', 1000)
      .clearValue('#login_name')
      .setValue('#login_name', "volpe")
      .pause(1000)
      .click('#login')
      .waitForElementVisible('#message', 1000)
      .assert.attributeEquals('#name', 'value', 'volpe')
      .end();
  }
};
