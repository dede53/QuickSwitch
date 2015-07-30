var app = angular.module('sampleApp', ['ngRoute','ngTouch',"highcharts-ng"]);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/favoriten', {
		templateUrl: 'templates/favoriten.html',
		controller: 'favoritenController'
	}).
	when('/devices', {
		templateUrl: 'templates/geräte.html',
		controller: 'devicesController'
	}).
	when('/editDevice/:id', {
		templateUrl: 'templates/editDevice.html',
		controller: 'editDeviceController'
	}).
	when('/rooms/', {
		templateUrl: 'templates/room.html',
		controller: 'roomController'
	}).
	when('/editRoom/:id', {
		templateUrl: 'templates/editRoom.html',
		controller: 'editRoomController'
	}).
	when('/user/', {
		templateUrl: 'templates/user.html',
		controller: 'userController'
	}).
	when('/editUser/:id', {
		templateUrl: 'templates/editUser.html',
		controller: 'editUserController'
	}).
	when('/temperature', {
		templateUrl: 'templates/temperature.html',
		controller: 'temperatureController'
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
		

});

app.controller('userController', function($scope, $rootScope, socket){
	
	socket.emit('getUser');
	
	socket.on('User',function(data){
		$rootScope.users = data;
	});
	$scope.deleteUser = function(data) {
		socket.emit('deleteUser', {"id":data.id});	
	}
	socket.on('deletedUser', function(data) {
		console.log(data);
		$rootScope.users = data;
	});
});
app.controller('editUserController', function($scope, $rootScope, socket, $routeParams){
	/***********************************************
	*	Daten anfordern
	***********************************************/
	if(!$routeParams.id){
			$scope.editUser = {
				title: "Hinzufügen"
			}
	}else{
		socket.emit('user', {"id":  $routeParams.id});

		/***********************************************
		*	Daten empfangen, Scope zuordnen
		***********************************************/
		socket.on('user', function(data) {
			console.log(data);
			
			if(data.constructor === Array){

				$scope.editUser = {
					title: "Bearbeiten",
					userlist: data[0]
				}
			}else{
				$scope.editUser = {
					title: "Achtung: Fehler!",
					userlist:{
						name: data
					}
				}
			}
		});
	}
});
app.controller('saveUserController', function($scope, socket, $location) {
		$scope.saveUser = function() {
			// Validierung!!
			socket.emit('saveUser', $scope.editUser.userlist);
			$location.url("/user");
		};
		socket.on('savedUser', function(data){
			alert("Antwort:" + data);
		});
});

app.controller('devicesController',  function($scope, $rootScope, socket) {
	socket.emit('devices', {"sort":"devices"});
	
	socket.on('devices', function(data) {
		$rootScope.devicelist = data;
	});
	$scope.deleteDevice = function(data) {
		socket.emit('deleteDevice', {"id":data.id});	
	}
	socket.on('deletedDevice', function(data) {
		console.log(data);
		$rootScope.devicelist = data;
	});
});
app.controller('editDeviceController',  function($scope, $rootScope, socket, $routeParams) {
	/***********************************************
	*	Daten anfordern
	***********************************************/
	if(!$routeParams.id){
			$scope.editDevice = {
				title: "Hinzufügen",
				devicelist: {
					buttonLabelOn: "An",
					buttonLabelOff: "Aus"
				}
			}
	}else{
		socket.emit('device', {"id":  $routeParams.id});

		/***********************************************
		*	Daten empfangen, Scope zuordnen
		***********************************************/
		socket.on('device', function(data) {
			// console.log(data);
			
			if(data.constructor === Array){

				$scope.editDevice = {
					title: "Bearbeiten",
					devicelist: data[0]
				}
				var protocolOptions = $scope.options[data[0].protocol];
				$scope.editDevice.devicelist.protocol = protocolOptions;
			}else{
				$scope.editDevice = {
					title: "Achtung: Fehler!",
					devicelist:{
						name: data
					}
				}
			}
		});
	}
	
	$scope.options = 	[
				{
					name: "Shell/exec",
					id: 1
				},
				{ 
					name: "URL/WGET",
					id: 2
				},
				{ 
					name: "Fritz!Dect 200",
					id: 3
				},
				{ 
					name: "Milight",
					id: 4
				},
				{ 
					name: "Connair - Brennenstuhl",
					id: 5
				},
				{ 
					name: "Connair - Elro",
					id: 6
				}
			];
});
app.controller('saveDeviceController', function($scope, socket) {
		$scope.submitnew = function() {
			// Validierung!!
			socket.emit('saveDevice', $scope.editDevice.devicelist);
			$location.url("/devices");
		};
		socket.on('savedDevice', function(data){
			alert("Antwort:" + data);
		});
});

app.controller('roomController',  function($scope, $rootScope, socket) {
	socket.emit('rooms');
	
	socket.on('rooms', function(data) {
		$rootScope.roomlist = data;
	});
	$scope.deleteRoom = function(data) {
		socket.emit('deleteRoom', {"id":data.id});	
	}
	socket.on('deletedRoom', function(data) {
		console.log(data);
		$rootScope.roomlist = data;
	});
});
app.controller('editRoomController',  function($scope, $rootScope, socket, $routeParams) {
	/***********************************************
	*	Daten anfordern
	***********************************************/
	if(!$routeParams.id){
			$scope.editRoom = {
				title: "Hinzufügen"
			}
	}else{
		socket.emit('room', {"id":  $routeParams.id});

		/***********************************************
		*	Daten empfangen, Scope zuordnen
		***********************************************/
		socket.on('room', function(data) {
			console.log(data);
			
			if(data.constructor === Array){

				$scope.editRoom = {
					title: "Bearbeiten",
					roomlist: data[0]
				}
			}else{
				$scope.editRoom = {
					title: "Achtung: Fehler!",
					roomlist:{
						name: data
					}
				}
			}
		});
	}
});
app.controller('saveRoomController', function($scope, socket, $location) {
		$scope.saveRoom = function() {
			// Validierung!!
			socket.emit('saveRoom', $scope.editRoom.roomlist);
			$location.url("/rooms");
		};
		socket.on('savedDevice', function(data){
			alert("Antwort:" + data);
		});
});

app.controller('temperatureController',  function($scope, $rootScope, socket) {
	$scope.chartTypes = [
		{"id": "line", "title": "Line"},
		{"id": "spline", "title": "Smooth line"},
		{"id": "area", "title": "Area"},
		{"id": "areaspline", "title": "Smooth area"},
		{"id": "column", "title": "Column"},
		{"id": "bar", "title": "Bar"},
		{"id": "pie", "title": "Pie"},
		{"id": "scatter", "title": "Scatter"}
	];

	$scope.dashStyles = [
		{"id": "Solid", "title": "Solid"},
		{"id": "ShortDash", "title": "ShortDash"},
		{"id": "ShortDot", "title": "ShortDot"},
		{"id": "ShortDashDot", "title": "ShortDashDot"},
		{"id": "ShortDashDotDot", "title": "ShortDashDotDot"},
		{"id": "Dot", "title": "Dot"},
		{"id": "Dash", "title": "Dash"},
		{"id": "LongDash", "title": "LongDash"},
		{"id": "DashDot", "title": "DashDot"},
		{"id": "LongDashDot", "title": "LongDashDot"},
		{"id": "LongDashDotDot", "title": "LongDashDotDot"}
	];

	$scope.chartSeries = [
		{"name": "Balkon", "data": 		[[1406246400000,25], [1406332800000,28], [1406419200000,33], [1406505600000,37], [1406592000000,30]]},
		{"name": "Gartenhaus", "data": 	[[1406246400000,25], [1406332800000,30], [1406419200000,33], [1406505600000,35], [1406592000000,29]]},
		{"name": "Pool", "data": 		[[1406246400000,18], [1406332800000,19], [1406419200000,19], [1406505600000,20], [1406592000000,20]]},
		{"name": "Solaranlage", "data": [[1406246400000,40], [1406332800000,55], [1406419200000,20], [1406505600000,25], [1406592000000,35]]}
	];

	$scope.chartStack = [
		{"id": '', "title": "No"},
		{"id": "normal", "title": "Normal"},
		{"id": "percent", "title": "Percent"}
	];
	$scope.chartConfig = {
		options: {
			chart: {
				type: 'spline'
			},
			plotOptions: {
				series: {
					stacking: ''
				}
			},
			xAxis: [{
                type: 'datetime',
				labels:{
					rotation: -45
				}
            }],
		},
		series: $scope.chartSeries,
		title: {
			text: 'Sensorwerte'
		},
		credits: {
			enabled: true
		},
		loading: false,
		size: {}
	}

	$scope.reflow = function () {
		$scope.$broadcast('highchartsng.reflow');
	};
});

app.controller("AppController", function($scope, $location, $rootScope, socket){
	
	socket.emit('newuser');
	
	socket.on('newuser', function(data) {
		console.log(data);
		$rootScope.users = data;
	});
	
	// Einstellungen für das Menu:
	// Beim Starten geöffnet sein?
	$scope.showmenu=false;
	$scope.toggleMenu = function(data){
		$scope.showmenu=!($scope.showmenu);
		console.log(data);
		if(data != ""){
			$location.url(data);
		}
		//data.stopPropagation();
	}
	
});








