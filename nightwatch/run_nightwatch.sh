#!/bin/bash

mongo nightwatch_db --eval "db.dropDatabase()"
node app.js -p 3010 -d nightwatch_db &
node_modules/nightwatch/bin/nightwatch -c nightwatch/nightwatch.json
kill -9 $!

