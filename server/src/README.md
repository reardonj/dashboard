# Overview

This project provides a simple local weather forecast display for my personal use. It consists of a React front-end that loads forecast data from Environment Canada via a proxy (as the data source does not support CORS).

There is a lot of remaining work to do on this project:

 - weather warnings need to be added to the front-end
 - handle precipitation warning indicator differently for snow
 - add temperature warning indicator
 - implement better proxy caching
 - add AMQP support to watch for forecast updates

 # Building

 Each subproject has its own package.json and is setup to run with yarn start.

 The Makefile at the root has two targets:

  - deploy-server: pushes the latest server commit to Heroku for deployment.
  - deploy-ui: Build the static react app, and copy it to my personal website project folder.