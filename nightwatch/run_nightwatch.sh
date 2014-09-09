#!/bin/bash

mongo nightwatch_db --eval "db.dropDatabase()"
cd ../
node app.js -d nightwatch_db &
cd nightwatch
../node_modules/nightwatch/bin/nightwatch -t $1
kill -9 $!

