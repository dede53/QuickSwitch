var app = angular.module('sampleApp', ['ngRoute','ngTouch','highcharts-ng']);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/favoriten', {
		templateUrl: 'templates/favoriten.html',
		controller: 'favoritenController'
	}).
	when('/temperature', {
		templateUrl: 'templates/temperaturen.html',
		controller: 'temperatureController'
	}).
	when('/devices', {
		templateUrl: 'templates/geräte.html',
		controller: 'devicesController'
	}).
	when('/rooms', {
		templateUrl: 'templates/räume.html',
		controller: 'roomController'
	}).
	otherwise({
		redirectTo: '/favoriten'
	});
}]);

	
app.factory('socket', function ($rootScope) {
	var socket = io.connect();
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
});

app.controller('favoritenController',  function($scope, $rootScope, socket) {
	

	// socket.emit('getSensorvalues', {"id":"all","date":"latest"});
	

	
	// socket.on('Sensorvalues', function(data) {
		// $rootScope.temperature = data;
	// });
	$scope.loadOldMessages = function(){
		socket.emit('loadOldMessages', $scope.sharedMessages[0].time);
	}
	
	$scope.switchdevice = function(data) {
		socket.emit('switchdevice', {"id":data.id,"status":data.status});
	}
	$scope.switchalldevices = function(data) {
		socket.emit('switchalldevices', {"status":data.status});
	}
	$scope.link = {};
	$scope.link.type = "1";
	
	socket.on('switchDevice', function(data) {
		$rootScope.favoritDevices[data.device.deviceid].status = data.status;
	});
});

app.controller('devicesController',  function($scope, $rootScope, socket) {
	/***********************
	* Toggle Funktion für geraeteliste
	****************************/
	$scope.custom = true;
	$scope.toggleCustom = function() {
		$scope.custom = $scope.custom === false ? true: false;
	};
	
	/***********************************************
	*	Daten anfordern
	***********************************************/
	socket.emit('devices');

	/***********************************************
	*	Daten empfangen, Scope zuordnen
	***********************************************/
	socket.on('devices', function(data) {
		$rootScope.devicelist = data;
	});
	
	/***********************************************
	*	Gerät schalten
	***********************************************/
	$scope.switchdevice = function(data) {
		socket.emit('switchdevice', {"id":data.id,"status":data.status});
	}
	socket.on('switchDevice', function(data) {
		$rootScope.devicelist[data.device.Raum][data.device.deviceid].status = data.status;
	});
	// socket.on('switchRoom', function(data) {
		// data.devices.forEach(function(dev){
			// $scope.devicelist[dev.Raum][dev.deviceid].status = data.status;
		// });
	// });
	
});

app.controller('roomController',  function($scope, $rootScope, socket) {
	/***********************
	* Toggle Funktion für geraeteliste
	****************************/
	// $scope.custom = true;
	// $scope.toggleCustom = function() {
		// $scope.custom = $scope.custom === false ? true: false;
	// };
	
	/***********************************************
	*	Daten anfordern
	***********************************************/
	socket.emit('rooms');

	/***********************************************
	*	Daten empfangen, Scope zuordnen
	***********************************************/
	socket.on('rooms', function(data) {
		$rootScope.roomlist = data;
	});
	
	/***********************************************
	*	Gerät schalten
	***********************************************/
	$scope.switchdevice = function(data) {
		socket.emit('switchdevice', {"id":data.id,"status":data.status});
	}
	$scope.switchroom = function(data) {
		// console.log(data);
		socket.emit('switchRoom', data);
	}
	
});

app.controller('temperatureController',  function($scope, $rootScope, socket) {

	// $rootScope.instruction = [];
	// $rootScope.instruction.css = "position: absolute;left: 0px;top: 0px;width:100%;height:100%;text-align:center;z-index: 1000;background-color: #fff; ";
	// $rootScope.instruction.css2 = " width:200px; margin: 0px 100px auto auto; background-color: #fff; border:1px solid #000; padding:15px; text-align:center;";
	// $rootScope.instruction.text="Hier werden Temperaturen angezeigt:";
	// $rootScope.instruction.toggle("instruction");
	// function afterSetExtremes(e) {
			// console.log(e.min);
			// console.log(e.max);
			// socket.emit('getSensorvalues', {"id":"all","min":e.min, "max":e.max});
			// socket.on('reloadedValues', function(data) {
				// // var sensor = {
					// // id: data.nodeID,
					// // data: data.data
				// // };
				// // $rootScope.chartConfig.series[0].data.setData(data);
				
				// $rootScope.chartConfig.series[0].data = [];
				// $rootScope.chartConfig.series[0].data.push(data.data);
			// });
        // // var chart = $('#container').highcharts();

        // // chart.showLoading('Loading data from server...');
        // // $.getJSON('http://www.highcharts.com/samples/data/from-sql.php?start=' + Math.round(e.min) +
                // // '&end=' + Math.round(e.max) + '&callback=?', function (data) {

                // // chart.series[0].setData(data);
                // // chart.hideLoading();
            // // });
    // }
	
	
	$rootScope.chartConfig = "";
	$rootScope.chartConfig = {
        options: {
            chart: {
                backgroundColor: 'transparent',
                zoomType: 'x'
            },
            navigator: {
                enabled: true,
                series: []
            },
            rangeSelector: {
                enabled: true,
                buttons: [{
                    type: 'hour',
                    count: 1,
                    text: 'Stunde'
                }, {
                    type: 'day',
                    count: 1,
                    text: 'Tag'
                }, {
                    type: 'month',
                    count: 1,
                    text: 'Monat'
                }, {
                    type: 'year',
                    count: 1,
                    text: 'Jahr'
                }, {
                    type: 'all',
                    text: 'Alle'
                }],
                selected : 4 // all
            },
            plotOptions: {
                series: {
                    lineWidth: 1,
                    fillOpacity: 0.5

                },
                column: {
                    stacking: 'normal'
                },
                area: {
                    stacking: 'normal',
                    marker: {
                        enabled: false
                    }
                }

            },
            exporting: false,
            xAxis: [{
                type: 'datetime',
				dateTimeLabelFormats: {
					second: '%Y-%m-%d<br/>%H:%M:%S',
					minute: '%Y-%m-%d<br/>%H:%M',
					hour: '%Y-%m-%d<br/>%H:%M',
					day: '%Y<br/>%m-%d',
					week: '%Y<br/>%m-%d',
					month: '%Y-%m',
					year: '%Y'
				},
				// events : {
                    // afterSetExtremes : afterSetExtremes
                // },
				labels:{
					rotation: -45
				}
            }],
            yAxis: [

                { // Primary yAxis

                    allowDecimals: true,
                    title: {
                        text: 'Temperatur',
                        style: {
                            color: '#80a3ca'
                        }
                    },
                    labels: {
                        format: '{value}',
                        style: {
                            color: '#80a3ca'
                        }
                    }


                }
				// ,
                // { // Secondary yAxis
                    // min: 0,
                    // allowDecimals: false,
                    // title: {
                        // text: 'Luftfeuchtigkeit',
                        // style: {
                            // color: '#c680ca'
                        // }
                    // },
                    // labels: {
                        // format: '{value}',
                        // style: {
                            // color: '#c680ca'
                        // }
                    // },
                    // opposite: true

                // }
            ],

            legend: {
                enabled: true
            },
            title: {
                text: 'Temperaturen'
            },
            credits: {
                enabled: false
            },

            loading: false,
            tooltip: {
                headerFormat: '<div class="header">{point.key}</div>',
                pointFormat: '<div class="line"><div class="circle" ></div><p class="country" style="float:left;">{series.name}</p><p>{point.y}</p></div>',
                borderWidth: 1,
                borderRadius: 5,
                borderColor: '#a4a4a4',
                shadow: false,
                useHTML: true,
                percentageDecimals: 2,
                backgroundColor: "rgba(255,255,255,.7)",
                style: {
                    padding: 0
                },
                shared: true
            },
            useHighStocks: true

        },
        series: []


    }

	
	socket.emit('getSensorvalues', {"id":"dia","date":"all"});
	$rootScope.chartConfig.series = [];
	socket.on('Sensorvalues', function(data) {
		console.log("Neue Daten");
		var sensor = {
			id: data.nodeID,
			name: data.name,
			data: data.data,
			type: data.linetyp,
			yAxis: 0,
			tooltip: {
				valueSuffix: ' °C'
			},
			color: '#'+data.farbe
		};
		var navigator = {
			data: data.data
		};
		
		$rootScope.chartConfig.options.navigator.series.push(navigator);
		$rootScope.chartConfig.series.push(sensor);
	});
		
	Highcharts.setOptions({
		global : {
			useUTC : false
		}
	});
		
	


	
});

app.controller('sendNewMessage', function($scope, socket) {
		$scope.sendMessage = function() {
			// Validierung!!
			// console.log($scope.link);
			// console.log($scope.activeUser);
			$scope.linkMessage = {
				author: $scope.activeUser.name,
				message: $scope.link.message,
				type: $scope.link.type
			}
			$scope.link.message = "";
			socket.emit('newLinkMessage', $scope.linkMessage);
			
		};

});

app.controller("AppController", function($scope, $location, $rootScope, socket){
	
	// $rootScope.instruction = [];
	$scope.sharedMessages = new Array;
	$scope.moreMessagesAvible = true;
	// $rootScope.instruction.css = "visibility: hidden;position: absolute;left: 0px;top: 0px;width:100%;height:100%;text-align:center;z-index: 1000; ";
	// $rootScope.instruction.css2 = " width:200px; margin: 0px 100px auto auto; background-color: #fff; border:1px solid #000; padding:15px; text-align:center;";
	// $rootScope.instruction.text="Hier kann ein Benutzer ausgewählt werden:";
	
	
	// $rootScope.instruction.toggle = function(id){
		// ell = document.getElementById(id);
		// ell.style.visibility = (ell.style.visibility == "visible") ? "hidden" : "visible";
	// }
	/*****************************
	Benutzername aus Cookie auslesen und derekt die Favoriten aufrufen.
	*****************************/
    var user = getCookie("username");
    if (user != "") {
		$scope.activeUser = JSON.parse(user);
		socket.emit('favoritDevices', $scope.activeUser);
    }
	// else{
		/*************************
		Hier nen POPUP für die Benutzerauswahl ??
		**************************/
        // user = prompt("Please enter your name:", "");
        // if (user != "" && user != null) {
            // setCookie("username", user, 365);
        // }
    // }
	socket.emit('newuser');
	
	
	socket.on('newuser', function(data) {
		$scope.values = data;
	});
	
	socket.on('favoritDevices', function(data) {
		$rootScope.favoritDevices = data;
	});
	
	$scope.setUser = function() {
		socket.emit('favoritDevices', $scope.activeUser);
		setCookie("username", JSON.stringify($scope.activeUser), 365);
	}
	
	$scope.activedeviceslist = [];
	socket.on('activedevices', function(data){
		$scope.activedeviceslist = data.activedevices;
	});
	

	socket.on('oldMessages', function(data){
		console.log(data);
		$scope.moreMessagesAvible = data.moreMessagesAvible;
		if(data.moreMessagesAvible == true){
			if(data.messages == ""){
				socket.emit('loadOldMessages', data.timestamp - (1000 * 60 * 60 * 24));
			}else{
				data.messages.forEach(function(message){
					$scope.sharedMessages.splice(0, 0, message);
				});
			}
		}
	});
	socket.on('newLinkMessage', function(data){
		$scope.sharedMessages.push(data);
	});
	


	
	// socket.on('switchRoom', function(data) {
		// data.devices.forEach(function(dev){
			// console.log(dev);
			// // $scope.activedeviceslist[dev.room][dev.deviceid].status = 0;
			// $scope.devicelist[dev.Raum][dev.deviceid].status = 0;
		// });
		// // console.log(data);
		// // console.log(data.devices);
		
		// // $rootScope.favoritDevices[data.device.deviceid].status = data.status;
	// });
	
	// Einstellungen für das Menu:
	// Beim Starten geöffnet sein?
	$scope.showmenu=false;
	$scope.toggleMenu = function(data){
		$scope.showmenu=!($scope.showmenu);
		if(data != ""){
			$location.url(data);
		}
		//data.stopPropagation();
	}
});

app.directive('targetBlank', function() {
  return {
    compile: function(element) {
      var elems = (element.prop("tagName") === 'A') ? element : element.find('a');
      elems.attr("target", "_blank");
    }
  };
});

app.directive("scrollBottom", function(){
    return {
        link: function(scope, element, attr){
            var $id= $("#" + attr.scrollBottom);
            $id.scrollTop($id[0].scrollHeight);
        }
    }
});

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

// function checkCookie() {
    // var user = getCookie("username");
    // if (user != "") {
        // alert("Welcome again " + user);
    // } else {
        // user = prompt("Please enter your name:", "");
        // if (user != "" && user != null) {
            // setCookie("username", user, 365);
        // }
    // }
// }


