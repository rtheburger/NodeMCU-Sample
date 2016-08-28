var http = require('http');
var fs = require ('fs');
var data = [];

module.exports = {
  getData: function () {
    return data;
  },
  poll: function (config) {
    var filename = config.db;
    var options = {
      host: config.sensor.host,
      path: config.sensor.path
    };

    if (fs.existsSync(filename)){
      data = JSON.parse( fs.readFileSync(filename,'utf8'));
      console.log('Restored %s entries.', data.length);
    }

    callback = function (res) {
      var str = '';

      res.on('data', function (chunk) {
        str += chunk;
      });

      res.on('end', function () {
        var obj = JSON.parse(str);
        obj.Time = new Date().toJSON();
        data.push(obj);

        fs.writeFile(filename, JSON.stringify(data), function(){
          console.log('Data saved!');
        });
      });
    }

    setInterval(function () {
      var req = http.request(options, callback);
      req.on('error', function () {
        console.log('Sensor is down, trying to reestablish connection ...');
      });
      req.end();
    }, config.refresh * 1000);
  },
};