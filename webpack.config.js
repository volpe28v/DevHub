const webpack = require("webpack");

module.exports = {
  context: __dirname + '/static/javascripts/app/',

  entry: {
    devhub: "./client.js",
    upload: "./upload.js",
    blog: "./blog.js",
    blog_permalink: "./blog_permalink.js",
    calendar: "./calendar.js",
  },

  output: {
    path: __dirname + '/static/javascripts/',
    filename: "./[name]_bundle.js"
  }
}
