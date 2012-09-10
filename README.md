# DevHub

初めての Node.js アプリ作成を通して学習しています。

## やりたいこと
* 開発中に開発メンバとの情報共有を促進したい
* URLとかをさくっと共有したい
* ソースの断片とかも気軽に共有したい
* チャットを書きこんでも緩めに通知したい
* Jenkins や SVN へのコミットの通知も一元化したい
* なんか使っていて楽しい感じにしたい
* みんな一緒に開発していて繋がっている感じを実感したい

## いまのところできること
* リアルタイムチャット
* 共有リアルタイムメモ帳
* メモ帳の履歴保持(最新のいくつか)
* メモのお気に入り登録
* 外部サービスからの通知API
* いろんな通知をアクセスしているメンバに Growl 通知
* ポモドーロタイマーで作業に集中(ポモドーロ中は Growl 通知が来ないようになる)
* DBへチャット履歴の保存

## デモ
http://dev-hub.herokuapp.com/

## install
必要なもの

* node 
* mongoDB 

<pre>
$ git clone git@github.com:volpe28v/DevHub.git
$ cd DevHub
$ npm install 
</pre>

* 起動

<pre>
$ node app.js -p 3000 -d devhub_db
</pre>
* -p ポート番号
* -d データベース名

## 外部サービスからの通知APIを叩く方法

* クエリーとして以下が必須
** name : サービス名
** msg  : メッセージ

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

## License
(The MIT License)

Copyright (c) 2012 Naoki KODAMA <naoki.koda@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

