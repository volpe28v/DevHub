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
$ node app.js -p 3000
</pre>

## 外部サービスからの通知APIを叩く方法
### Jenkins
* Post build task　プラグインをインストール
* 以下のスクリプトを実行するようにする

<pre>
RESULT=`curl ${BUILD_URL}api/xml | perl -le '$_=<>;print [/<result>(.+?)</]->[0]'`
wget http://XXXXX:3000/notify?msg="【Jenkins】 ($JOB_NAME): $RESULT"
</pre>

### Subversion
* hooks/post-commit に以下を記述する

<pre>
NAME=`svnlook author $REPOS -r $REV | nkf -w`
CHANGE=`svnlook changed $REPOS -r $REV | nkf -w`
LOG=`svnlook log $REPOS -r $REV | nkf -w`
wget http://XXXXX:3000/notify?msg="SVN ($NAME): $LOG"
</pre>

