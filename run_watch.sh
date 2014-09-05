mongo nightwatch_db --eval "db.dropDatabase()"
node app.js -d nightwatch_db &
nightwatch
kill -9 $!

