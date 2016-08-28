var distance = 0;
var sensor = require('./poll.js');
var express = require('express');
var app = express();
var dargestellteZeit = 4; //Anzahl Stunden die in den Graphen gezeigt werden. normal 4
var glaettungsZeit = 5//glättungszeit für Partyindex in Minuten
var buffer = {
    lastLength: 0,
    value: undefined
};

function transformDataItemHDC (item) {
    return {
        x: item.Time,
        y: item.TemperatureHDC
    };
}

function transformDataItemAMP (item) {
    return {
        x: item.Time,
        y: item.Amplitude
    };
}

function transformDataItemHUM (item) {
    return {
        x: item.Time,
        y: item.Humidity
    };
}

function transformDataItemPARTY(item) {
    if(!item.hasOwnProperty('Amplitude')){
        return{
            x: item.Time,
            y: 0
        }
    } else {
    	var smoothFilter = new Date(item.Time);
	    smoothFilter.setMinutes(smoothFilter.getMinutes() - glaettungsZeit);
	    var data = sensor.getData();
	    var last5MinutesAMP = data.filter(onlyRecentItems(smoothFilter));
	    var acc = 0;
	    for(var i = 0; i < last5MinutesAMP.length; i++){
	    	acc = acc + last5MinutesAMP[i].Amplitude;
	    }
    
		var smoothAmplitude = acc / last5MinutesAMP.length; //- 40; wurde getestet

        if (smoothAmplitude <= 10){
            return{
                x: item.Time,
                y: 0
            };
        } else if(smoothAmplitude >= 300){
            return{
                x: item.Time,
                y: 10
            };
        } else{
            var partyIndex = ((item.Humidity-50) + item.Amplitude + (item.TemperatureHDC-20)*5)/27; //tempfaktor jetzt auf 8, vorher 5
            if (partyIndex > 10){partyIndex = 10;}
            return{
                x: item.Time,
                y: partyIndex
            };
        }
    }
}

function transformSmoothParty(item){
	var average = 0;

}

function transformDataItemBAR (item) {
    return {
        x: item.Time,
        y: item.RelPressure
    };
}

function onlyRecentItems2 (filterTime, startTime) {
    return function (item) {
        return ((new Date(item.Time) > filterTime) && (Date(item.Time)<startTime));
    }
}

function onlyRecentItems (filterTime) {
    return function (item) {
        return new Date(item.Time) > filterTime;
    }
}

function tryGetFromBuffer () {
    var data = sensor.getData();

    if (data.length !== buffer.lastLength || !buffer.value) {
        var timeFilter = new Date();
        timeFilter.setMinutes(timeFilter.getMinutes() - dargestellteZeit*60);

        var filteredData = data.filter(onlyRecentItems(timeFilter));
      
        var itemsHDC = filteredData.map(transformDataItemHDC);
        var itemsHUM = filteredData.map(transformDataItemHUM);
        var itemsBAR = filteredData.map(transformDataItemBAR);
        var itemsAMP = filteredData.map(transformDataItemAMP);
        var itemsParty = filteredData.map(transformDataItemPARTY);
        buffer.lastLength = data.length;
        buffer.value = {
          temperature: itemsHDC,
          humidity: itemsHUM,
          pressure: itemsBAR,
          sound: itemsAMP,
          party: itemsParty
        };
    }

    return buffer.value;
}

//Polling der Daten, Intervall in poll.js spezifiziert
sensor.poll();

//eigentlicher Server ab hier:
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/assets/'));

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
    var data = tryGetFromBuffer();
    res.header('Access-Control-Allow-Origin', '*');
    res.json(data);
});

app.get('/', function (req, res) {
    res.render('index', { 
        scripts: ['js/Chart.bundle.min.js', 'js/chartMaker.js'],
        styles: ['css/wetterStyles.css'],
        title: 'Sommerakademie Leysin - Wetterstation im Auditorium', 
    });
    console.log("New Client on / ")
});


var server = app.listen(80, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});
