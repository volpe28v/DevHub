# DevHub

## やりたいこと
* 開発中に開発メンバとの情報共有を促進したい
* URLとか教えるのにメールとかめんどい
* ソースの断片とかも気軽に共有したい
* チャットを書きこんでも緩めに通知したい
* Jenkins や SVN へのコミットの通知も一元化したい
* なんか使っていて楽しい感じにしたい
* みんな一緒に開発している感じを実感したい

## いまのところできること
* リアルタイムチャット
* 共有リアルタイムメモ帳
* 外部サービスからの通知API
* いろんな通知をアクセスしているメンバに Growl 通知
* チャットの見える化(WebSequenceを使って。)
* ポモドーロタイマー(ポモドーロ中は Growl 通知が来ない)

## install
* node が入っていることが前提

* 以下のプラグインをインストール

 $ npm install express
 $ npm install ejs
 $ npm install socket.io
 $ npm install commander

* 起動

 $ node app.js -p 3000

## 外部サービスからの通知APIを叩く方法
### Jenkins
* Post build task　プラグインをインストール
* 以下のスクリプトを実行するようにする

 RESULT=`curl ${BUILD_URL}api/xml | perl -le '$_=<>;print [/<result>(.+?)</]->[0]'`
 wget http://XXXXX:3000/notify?msg="【Jenkins】 ($JOB_NAME): $RESULT"


