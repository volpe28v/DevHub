#!/usr/bin/ruby

require 'uri'
require 'kconv'

name = "GitBucket"
msg = "2014/05/26 [Kumamon](http://kumamon-official.jp/) が push されたなっしー"
target = "http://localhost:3004/"
no = 10
line = 1

url = target + "memo?name=#{URI.escape(name.toutf8,Regexp.new("[^#{URI::PATTERN::ALNUM}]"))}&msg=#{URI.escape(msg.toutf8,Regexp.new("[^#{URI::PATTERN::ALNUM}]"))}&no=#{no}&line=#{line}"
system('wget --output-document=/dev/null "' + url + '" ')

#url = target + "memo?name=#{URI.escape(name.toutf8,Regexp.new("[^#{URI::PATTERN::ALNUM}]"))}&msg=#{URI.escape(msg.toutf8,Regexp.new("[^#{URI::PATTERN::ALNUM}]"))}&no=2"
#system('wget --output-document=/dev/null "' + url + '" ')

#url = target + "memo?name=#{URI.escape(name.toutf8,Regexp.new("[^#{URI::PATTERN::ALNUM}]"))}&msg=#{URI.escape(msg.toutf8,Regexp.new("[^#{URI::PATTERN::ALNUM}]"))}"
#system('wget --output-document=/dev/null "' + url + '" ')

