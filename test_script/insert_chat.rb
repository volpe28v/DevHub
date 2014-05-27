#!/usr/bin/ruby

require 'uri'
require 'kconv'

name = "GitBucket"
msg = "[Kumamon](http://kumamon-official.jp/) が push されたなっしー"

target = "http://localhost:3004/"
url = target + "notify?name=#{URI.escape(name.toutf8,Regexp.new("[^#{URI::PATTERN::ALNUM}]"))}&msg=#{URI.escape(msg.toutf8,Regexp.new("[^#{URI::PATTERN::ALNUM}]"))}"
system('wget --output-document=/dev/null "' + url + '" ')

