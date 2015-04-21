# DevHub

## やりたいこと
* 開発中に開発メンバとの情報共有を促進したい
* URLとかをさくっと共有したい
* ソースの断片とかも気軽に共有したい
* チャットを書きこんでも緩めに通知したい
* Jenkins や SVN へのコミットの通知も一元化したい
* なんか使っていて楽しい感じにしたい
* みんな一緒に開発していて繋がっている感じを実感したい

## いまのところできること
* リアルタイムチャット(複数部屋)
* 共有リアルタイムメモ帳(複数枚)
* メモの履歴差分表示(最新のいくつか)
* 外部サービスからの通知API
* DBへチャット履歴の保存
* ファイルのドロップによるアップロード(画像は表示される)
* 共有メモをブログとして保存
* モバイル対応(フリックによるチャット⇔メモ切り替え)

## デモ
http://dev-hub.herokuapp.com/

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## インストール
必要なもの

* node 
* mongoDB 

<pre>
$ git clone git@github.com:volpe28v/DevHub.git
$ cd DevHub
$ npm install 
</pre>

## 起動

<pre>
$ node app.js -p 3000 -d devhub_db -t title
</pre>
* -p ポート番号(default 3000)
* -d データベース名(default devhub_db)
* -t タイトル(default '')

### Basic認証をかける
<pre>
$ BASIC_AUTH_USER=user BASIC_AUTH_PASS=pass node app.js -p 3000 -d devhub_db -t title
</pre>
* BASIC_AUTH_USER ユーザ名
* BASIC_AUTH_PASS パスワード

## 操作ヒント
### チャット
* ユーザ名をクリックで宛先指定
* 画像、その他ファイルをドロップでアップロード
* 話題・チームによって部屋を使い分ける(設定から部屋数変更可能)

### 共有メモ
* メモ欄の任意の場所をダブルクリックで指定箇所の編集開始
* 編集中に Ctrl-Enter またはダブルクリックで編集終了
* MarkDown に一部対応
<pre>
"#, ##, ###, ####" -> h1, h2, h3, h4
"- [ ]" -> チェックボックス
行末に #red -> 一行色付け
</pre>
* 画像、その他ファイルをドロップでアップロード

その他記法の詳細は[Wiki](https://github.com/volpe28v/DevHub/wiki/%E8%A8%98%E6%B3%95)参照

### 通知
* チャットメッセージをポップアップでデスクトップ表示
* Settings にて WebNotification を有効にする

### アバター
* ユーザ名の代わりにお好きなアイコンを表示
* Settings にてアバターアイコンを設定する


## 外部連携
### Hubot
https://github.com/hashrock/hubot-devhub

### Redmine, GitHub, Gitlab, GitBucket
https://github.com/hashrock/DevhubHook

## 汎用通知API

* クエリーとして以下が必須
* name : サービス名
* msg  : メッセージ

### Jenkins
* Post build task　プラグインをインストール
* 以下のスクリプトを実行するようにする

<pre>
RESULT=`curl ${BUILD_URL}api/xml | perl -le '$_=<>;print [/<result>(.+?)</]->[0]'`
wget http://XXXXX:3000/notify?name=Jenkins&msg="($JOB_NAME): $RESULT"
</pre>

### Subversion
* hooks/post-commit に以下を記述する

<pre>
NAME=`svnlook author $REPOS -r $REV | nkf -w`
CHANGE=`svnlook changed $REPOS -r $REV | nkf -w`
LOG=`svnlook log $REPOS -r $REV | nkf -w`
wget http://XXXXX:3000/notify?name=SVN&msg="($NAME): $LOG"
</pre>

## その他Tips
### メニューバーにリンクを追加する
* よく行くサイトのリンクをDevhubの上部メニューに表示しておくことができる。
* /lib/menu_links.json を追加する。

<pre>
[
  {"name": "Google", "url": "https://www.google.co.jp/"},
  {"name": "FaceBook", "url": "https://www.facebook.com/"}
]
</pre>

### 部屋名を変更する
チャットから、```room_name:部屋名``` を打ち込むと部屋名を変更できる。
部屋数は設定から変更可能。

### 組み込み bot を追加する
/lib/bots 配下に js ファイルを追加する。実装例は david.js を参照。
<pre>
var util = require('../util');
module.exports.action = function(data, callback){
  if (data.msg.match(/David/i)){ //自分の名前が呼ばれたら
    // 返答を生成
    var reply = {
      name: "David",
      date: util.getFullDate(new Date()),
      msg: "@" + data.name + "さん ん、なんか用かい？ 俺は今ホームパーティーで忙しいんだ。出来れば後にしてくれないか。"
    };

    // 1秒後に返答する
    setTimeout(function(){
      callback(reply);
    },1000);
  }
};
</pre>

## License
(The MIT License)

Copyright (c) 2012 Naoki KODAMA <naoki.koda@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

