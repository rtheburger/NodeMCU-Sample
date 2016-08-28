var fs = require('fs');
var sensor = require('./sensor.js');
var server = require('./server.js');
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

sensor.poll(config);
server.start(config, sensor);