module.exports = {
  '名前指定ログイン' : function (client) {
    client
      .url('http://localhost:3010')
      .waitForElementVisible('#name_in', 1000)
      .clearValue('#login_name')
      .setValue('#login_name', "volpe")
      .pause(1000)
      .click('#login')
      .waitForElementVisible('#login_own', 1000)
      .assert.containsText('#login_own', 'volpe')
      .end();
  }
};
