#!/usr/bin/env bash

hash livehttp && xdg-open 'http://localhost:5000/index.html' && livehttp && exit
hash ran && xdg-open 'http://localhost:8080' && ran -cors=true && exit

echo 'No static web server detected, run any of the following commands to install one:'
echo ' - python3 -m pip install livehttp'
echo ' - go get -u github.com/m3ng9i/ran'
