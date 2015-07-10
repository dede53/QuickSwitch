var app = angular.module('sampleApp', ['ngRoute','ngTouch']);

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
		
	socket.emit('devices', {"sort":"devices"});
	// socket.emit('devices', {"sort":"devcies"});
	// socket.emit('devices', {"sort":"rooms"});
	// socket.emit('temperature');
	socket.emit('getSensorvalues', {"id":"all","date":"latest"});
	
	socket.on('devices', function(data) {
		console.log(data);
		$rootScope.devicelist = data;
	});
	socket.on('Sensorvalues', function(data) {
		console.log(data);
		$rootScope.temperature = data;
	});
	// socket.on('switchdevice', function(data){
		// alert(data.id+' : '+data.status);
	// });
	$scope.switchdevice = function(data) {
		socket.emit('switchdevice', {"id":data.id,"status":data.status});
		//alert(data.id+' : '+data.status);
	}
	$scope.switchalldevices = function(data) {
		socket.emit('switchalldevices', {"status":data.status});
		//alert(data.id+' : '+data.status);
	}
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
	socket.emit('devices', {"sort":"devices"});

	/***********************************************
	*	Daten empfangen, Scope zuordnen
	***********************************************/
	socket.on('devices', function(data) {
		console.log(data);
		$rootScope.devicelist = data;
	});
	
	/***********************************************
	*	Gerät schalten
	***********************************************/
	$scope.switchdevice = function(data) {
		socket.emit('switchdevice', {"id":data.id,"status":data.status});
	}
	
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
	socket.emit('devices', {"sort":"rooms"});

	/***********************************************
	*	Daten empfangen, Scope zuordnen
	***********************************************/
	socket.on('roomlist', function(data) {
		console.log(data);
		$rootScope.roomlist = data;
	});
	
	/***********************************************
	*	Gerät schalten
	***********************************************/
	$scope.switchdevice = function(data) {
		socket.emit('switchdevice', {"id":data.id,"status":data.status});
	}
	
});

app.controller('temperatureController',  function($scope, $rootScope, socket) {
	socket.emit('getSensorvalues', {"id":"all","date":"latest"});
	socket.on('Sensorvalues', function(data) {
		console.log(data);
		$rootScope.temperature = data;
	});
});

app.controller("AppController", function($scope, $location, $rootScope, socket){

	// Variable für aktive GEräte
	// $scope.activedeviceslist = [];
	$scope.activedeviceslist = [];
	socket.emit('newuser');
	
	socket.on('newuser', function(data) {
		console.log(data);
	});
	
	socket.on('switchdevice', function(data){
		alert(data.name +'mit der ID' + data.id+' : '+data.status + 'geschaltet \n (0 = aus; 1 = ein)');
	});
	
	socket.on('activedevices', function(data){
		console.log(data);
		$scope.activedeviceslist = data.activedevices;
	});
	
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



// AppController.$inject = ['$scope', 'dataexchange']; 
// favoritenController.$inject = ['$scope', 'dataexchange']; 

app.directive('createTable', function ($compile) {
    return {
        link: function (scope, element, attrs) {
            var contentTr = angular.element('<tr><td>test</td></tr>');
            contentTr.insertAfter(element);
            $compile(contentTr)(scope);
        }
    }
});








