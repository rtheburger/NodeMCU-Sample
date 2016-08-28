var http = require('http');
var fs = require ('fs');
var data = [];

module.exports = {
  getData: function () {
    return data;
  },
  poll: function () {
    var filename = "wetterstation_daten.txt"
    //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
    var options = {
      host: '192.168.10.217',
      path: '/raw'
    };

    //im Falle eines neustarts des Servers die alten Daten wieder einlesen, damit sie nicht verloren gehen beim fswriteFile
    if (fs.existsSync(filename)){
      data = JSON.parse( fs.readFileSync(filename,'utf8'));
      console.log('Restored %s entries.', data.length);
    }

    callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        var obj = JSON.parse(str);
        obj.Time = new Date().toJSON();
        data.push(obj);

        fs.writeFile(filename, JSON.stringify(data), function(){
          console.log('Data saved!');
        });
      });
    }

    setInterval(function() {
      var request = http.request(options, callback);
      request.on('error', function () {
        console.log('Sensor is down, trying to reestablish connection');
      })
      request.end();
    }, 60 * 1000);
  },
};