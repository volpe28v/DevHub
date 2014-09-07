mongo nightwatch_db --eval "db.dropDatabase()"
node app.js -d nightwatch_db &
nightwatch -t $1
kill -9 $!

