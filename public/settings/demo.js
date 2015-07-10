var app = angular.module('sampleApp', ['ngRoute','ngTouch']);
/*
// app.directive('mySlideController', ['$swipe', function($swipe) {
	// return {
		// restrict: 'EA',
		// link: function(scope, ele, attrs, ctrl) {
			// var startX, pointX;
			// $swipe.bind(ele, {
				// 'start': function(coords) {
					// startX = coords.x;
					// pointX = coords.y;
				// },
				// 'move': function(coords) {
					// var delta = coords.x - pointX;
					// // ...
				// },
				// 'end': function(coords) {
					// // ...
				// },
				// 'cancel': function(coords) {
					// // ...
				// }
			// });
		// }
	// }
// }]);
*/

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
	
	socket.on('devices', function(data) {
		console.log(data);
		$rootScope.devicelist = data;
	});
});

app.controller('devicesController',  function($scope, $rootScope, socket) {
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
					name: "Connair - Brennenstuhl",
					id: 3
				},
				{ 
					name: "Connair - Elro",
					id: 4
				}
			];
});




app.controller('saveDeviceController', function($scope, socket) {
		$scope.submitnew = function() {
			// Validierung!!
			socket.emit('saveDevice', $scope.editDevice.devicelist);	
		};
		socket.on('savedDevice', function(data){
			alert("Antwort:" + data);
		});
});



app.controller('temperatureController',  function($scope, $rootScope, socket) {
		
	socket.emit('temperature');
	socket.on('temperature', function(data) {
		console.log(data);
		$rootScope.temperature = data;
	});
});

app.controller("AppController", function($scope, $location, $rootScope, socket){
	
	socket.emit('newuser');
	
	socket.on('newuser', function(data) {
		console.log(data);
		$rootScope.temperature = data;
	});
	
	socket.on('switchdevice', function(data){
		alert(data.id+' : '+data.status);
	});
	
	// Einstellungen für das Menu:
	// Beim Starten geöffnet sein?
	$scope.showmenu=false;
	
	// $scope.editDevice = function(data){
		// if(data != ""){
			// $location.url(/editDevice);
		// }
	// }
	
	$scope.toggleMenu = function(data){
		$scope.showmenu=!($scope.showmenu);
		console.log(data);
		if(data != ""){
			$location.url(data);
		}
		//data.stopPropagation();
	}
	
});

app.controller('ShowOrdersController', function($scope) {


	$scope.message = 'This is Show orders screen';

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








