var express = require('express');
var transform = require('./transform.js');
var buffer = {
  lastLength: 0,
  value: undefined
};
var distance = 0;

function onlyRecentItems (hours) {
  var filterTime = new Date();
  filterTime.setMinutes(filterTime.getMinutes() - hours * 60);

  return function (item) {
    return new Date(item.Time) > filterTime;
  }
}

module.exports = {
  start: function (config, sensor) {
    var app = express();
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/' + config.server.assets));
    
    app.post('/distance', function (req, res) {
      var str = '';
      req.on('data', function (chunk) {
        str += chunk;
      });
      req.on('end', function () {
        distance = str * 1;
        res.status(200).end(); 
      });
    });
    
    app.get('/distance', function (req, res) {
      res.header('Access-Control-Allow-Origin', '*');
      res.send(distance.toString());
    });
    
    app.get('/weather', function (req, res) {
      var data = sensor.getData();

      if (data.length !== buffer.lastLength || !buffer.value) {
        var filteredData = data.filter(onlyRecentItems(config.server.displayedHours));
        buffer.lastLength = data.length;
        buffer.value = {
          temperature: filteredData.map(transform.temperature),
          humidity: filteredData.map(transform.humidity),
          pressure: filteredData.map(transform.pressure),
          sound: filteredData.map(transform.amplitude),
          party: filteredData.map(transform.party)
        };
      }

      res.header('Access-Control-Allow-Origin', '*');
      res.json(buffer.value);
    });
    
    app.get('/', function (req, res) {
      res.render('index', { 
        scripts: ['js/Chart.bundle.min.js', 'js/chartMaker.js'],
        styles: ['css/style.css'],
        title: 'Sommerakademie Leysin - Wetterstation im Auditorium', 
      });
    });

    var server = app.listen(config.server.port, function () {
      var host = server.address().address;
      var port = server.address().port;
      console.log("App listening at http://%s:%s", host, port);
    });
    return server;
  }
};
