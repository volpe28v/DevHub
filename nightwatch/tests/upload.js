module.exports = {
  'アップロード画面が表示されること' : function (client) {
    client
      .url('http://localhost:3010/upload')
      .assert.containsText('.brand', 'DevHub - uploads')
  },

  'アップロード画面テスト終了' : function (client) {
    client
      .end();
  }
};
