var smoothingTime = 5;

module.exports = {
  temperature: function (item) {
    return {
      x: item.Time,
      y: item.TemperatureHDC
    };
  },
  amplitude: function (item) {
    return {
      x: item.Time,
      y: item.Amplitude
    };
  },
  humidity: function (item) {
    return {
      x: item.Time,
      y: item.Humidity
    };
  },
  party: function (item) {
    if (!item.hasOwnProperty('Amplitude')){
      return {
        x: item.Time,
        y: 0
      };
    } else {
      var smoothFilter = new Date(item.Time);
      smoothFilter.setMinutes(smoothFilter.getMinutes() - smoothingTime);
      var data = sensor.getData();
      var last5MinutesAMP = data.filter(onlyRecentItems(smoothFilter));
      var acc = 0;
  
      for(var i = 0; i < last5MinutesAMP.length; i++){
        acc += last5MinutesAMP[i].Amplitude;
      }
    
      var smoothAmplitude = acc / last5MinutesAMP.length;
  
      if (smoothAmplitude <= 10) {
        return {
          x: item.Time,
          y: 0
        };
      } else if (smoothAmplitude >= 300) {
        return {
          x: item.Time,
          y: 10
        };
      } else {
        var partyIndex = (item.Humidity - 50 + item.Amplitude + (item.TemperatureHDC - 20) * 5) / 27;
  
        if (partyIndex > 10) {
          partyIndex = 10;
        }
        
        return {
          x: item.Time,
          y: partyIndex
        };
      }
    }
  },
  pressure: function (item) {
    return {
      x: item.Time,
      y: item.RelPressure
    };
  },
};