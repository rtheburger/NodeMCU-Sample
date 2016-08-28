refreshCharts();

setInterval(refreshCharts, 10 * 1000);


function request (url, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        var DONE = this.DONE || 4;
        if (this.readyState === DONE) {
            callback(JSON.parse(this.responseText));
        }
    };
    request.open('GET', url, true);
    request.send(null); 
}

function refreshCharts (){
    request('/weather', function (obj) {
        var ctx_Party = document.querySelector("#partyIndexChart");
        var ctx_01 = document.querySelector("#Hum_TempChart");
        var ctx_02 = document.querySelector("#barometerChart");
        var data_tempHDC = obj.temperature;
        var data_HUM = obj.humidity;
        var data_BAR = obj.pressure;
        var data_AMP = obj.sound;
        var data_PartyIndex = obj.party;

        var PartyChart = new Chart(ctx_Party, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Party-Index',
                        data: data_PartyIndex,
                        fill: false,
                        borderWidth: 3,
                        borderColor: 'rgba(255,0,255,0.5)',
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    xAxes: [{
                        type: 'time',
                        unit: 'day',
                        time: {
                            displayFormats: {
                               'day': 'MMM DD'
                            }
                        },
                        gridLines: {
                            display: false
                        }
                    }],
                    yAxes: [
                        {
                            scaleLine: {
                                display: false
                            },
                            gridLines: {
                                display: true,
                            },
                            ticks: {
                                max: 10,
                                min: 0,
                                stepSize: 1
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Party-Index in DpS",
                            }
                        }

                    ]
                }
            }
        });

        var HumTempChart = new Chart(ctx_01, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Temperature',
                        data: data_tempHDC,
                        borderColor: 'rgba(255,0,0,1.0)',
                        yAxisID: 'TEMP_AX',
                        borderWidth: 3,
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Humidity',
                        borderColor: 'rgba(0,0,0,0.3)',
                        data: data_HUM,
                        borderWidth: 3,
                        pointRadius: 0,
                        yAxisID: 'HUM_AX',
                        fill: false
                    },
                    {
                        label: 'Sound Pressure',
                        data: data_AMP,
                        borderColor: 'rgba(0,255,0,1.0)',
                        yAxisID: 'AMP_AX',
                        borderWidth: 3,
                        fill: false,
                        pointRadius: 0

                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    xAxes: [{
                        type: 'time',
                        unit: 'day',
                        time: {
                            displayFormats: {
                               'day': 'MMM DD'
                            }
                        },
                        gridLines: {
                            display: false
                        }
                    }],
                    yAxes: [
                        {
                            id: 'TEMP_AX',
                            scaleLineColor: 'rgba(255,0,0,1.0)',
                            ticks: {
                                suggestedMax: 30,
                                min: 15,
                                stepSize: 1
                            },
                            gridLines: {
                                display: true,
                            },
                             scaleLabel: {
                                display: true,
                                labelString: "Temperature in °C",
                                fontColor: 'rgba(255,0,0,1.0)'
                            }
                        },
                        {
                            id: 'AMP_AX',
                            scaleLineColor: 'rgba(255,0,0,1.0)',
                            ticks: {
                                suggestedMax: 300,
                                min: 0,
                                stepSize: 50
                            },
                            gridLines: {
                                display: false,
                            },
                             scaleLabel: {
                                display: true,
                                labelString: "Sound Pressure",
                                fontColor: 'rgba(0,255,0,1.0)'
                            }
                        },
                        {
                            id: 'HUM_AX',
                            position: 'right',
                            scaleLine: {
                                display: false
                            },
                            gridLines: {
                                display: true,
                                zeroLineColor: 'rgba(255,0,0,1.0)'
                            },
                            ticks: {
                                max: 100,
                                min: 40,
                                stepSize: 4
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Humidity in %"
                            }
                        }

                    ]
                }
            }
        });

        var barChart = new Chart(ctx_02, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Relative Pressure',
                        data: data_BAR,
                        fill: false,
                        borderWidth: 3,
                        borderColor: 'rgba(0,0,0,0.5)',
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    xAxes: [{
                        type: 'time',
                        unit: 'day',
                        time: {
                            displayFormats: {
                               'day': 'MMM DD'
                            }
                        },
                        gridLines: {
                            display: false
                        }
                    }],
                    yAxes: [
                        {
                            scaleLine: {
                                display: false
                            },
                            gridLines: {
                                display: true,
                            },
                            ticks: {
                                suggestedMax: 1030,
                                min: 1000,
                                stepSize: 5
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Pressure in hPa",
                            }
                        }

                    ]
                }
            }
        });
    });
}