#!/usr/local/bin/node
process.env.TZ = 'Europe/Amsterdam';
/*******************************************
Config API

Stellt die Datenbankverbindung her und stellt die Daten als JSON zur verf�gung

Aufrufe:

 ############################
 
 Methode:		GET
 URL:			"ip:8000/switches"
 Aktion:		Alle Ger�te als JSON-Liste
 
 ############################
 
 Methode:		GET
 URL:			"ip:8000/switches/:id"
 Aktion:		JSON f�r ein Ger�t mit passender ID

 ############################
 
 HEADER:		'Content-Type: application/json'
 Methode:		POST
 POST-DATA:		{ "name": "Lamp 1", "command": "B 1", "status": "0"}
 URL:			"ip:8000/switches"
 Aktion:		f�gt ein Ger�t zur Datenbank hinzu

 ############################
 
 HEADER:		'Content-Type: application/json'
 Methode:		PUT
 DATA:			{"status": "0"}
 URL:			"ip:8000/switches/:id"
 Aktion:		schaltet ein Ger�t
 
 ############################
 
 Methode:		DELETE
 URL:			"ip:8000/switches/:id"
 Aktion:		L�scht ein Ger�t

 #############################
 
 HEADER:		'Content-Type: application/json'
 Methode:		PUT
 DATA:			{"status": "0"}
 URL:			"ip:8000/switches"
 Aktion:		schaltet alle Ger�te
 
 #############################
*******************************************/


 
var express = require('express.io');
var app = express().http().io();

var request = require('request');
var exec = require('exec');
var dgram = require('dgram');  
var http = require('http'); 
var util = require('util');
var exec = require('child_process').exec;
var sleep = require('sleep');
var async = require("async");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multer = require('multer');
var colors = require('colors');
var cookies = new Object;
// var process = require('child_process');

// process.exec('node SwitchServer.js', function(error, stdout, stderr){
	   // if (error) {
	     // console.log(error.stack);
	     // console.log('Error code: '+error.code);
	     // console.log('Signal received: '+error.signal);
	   // }
	   // console.log('stdout: ' + stdout);
	   // console.log('stderr: ' + stderr);
// });



var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('abc.db');

// Datenbank anlegen wenn nicht schon geschehen
db.run("CREATE TABLE if not exists [devices] ([deviceid] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[status] TEXT  NULL,[name] TEXT  NOT NULL,[protocol] TEXT  NOT NULL,[buttonLabelOn] TEXT  NOT NULL,[buttonLabelOff] TEXT  NOT NULL,[CodeOn] TEXT,[CodeOff] TEXT,[room] TEXT);");


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
app.use(cookieParser());

app.use(express.static(__dirname + '/public'));

// Initial web request.
app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public');
});

app.get('/settings', function(req, res) {
    res.sendfile(__dirname + '/public/settings');
});



app.io.route('favoritDevices', function( req, res){
	var data = req.data;
	log(data.name + " hat QuickSwitch geöffnet", "debug");
	
	favoritDevices(data, req,res,function(data){
		req.io.emit('favoritDevices', data);
	});
});
app.io.route('newuser',function(req, res){
	getUsers(req,res,function(data){
		req.io.emit('newuser', data);
	});
	sendActiveDevices();
});
app.io.route('saveDevice', function(req, res){
	if( !req.data.deviceid){
		var data = {
			"name": req.data.name,
			"buttonLabelOn": req.data.buttonLabelOn,
			"buttonLabelOff": req.data.buttonLabelOff,
			"CodeOn": req.data.CodeOn,
			"CodeOff": req.data.CodeOff,
			"protocol": req.data.protocol.id,
			"room": req.data.room
		};
		saveNewDevice(data, req, res, function(data){
			req.io.emit('savedNewDevice', data);
			getDevices(req, res, function(data){
				app.io.broadcast('devices', data);
			});
		});
	}else{
		var data = 
			{
				"deviceid": req.data.deviceid,
				"name": req.data.name,
				"buttonLabelOn": req.data.buttonLabelOn,
				"buttonLabelOff": req.data.buttonLabelOff,
				"CodeOn": req.data.CodeOn,
				"CodeOff": req.data.CodeOff,
				"protocol": req.data.protocol.id,
				"room": req.data.room
			};
		saveEditDevice(data, req, res, function(data){
			req.io.emit('savedEditDevice', data);
			getDevices(req, res, function(data){
				app.io.broadcast('devices', data);
			});
		});
	}
});
app.io.route('deleteDevice', function(req, res){
	var id = req.data.id;
	deleteDevice(id, req, res, function(data){
		req.io.emit('deletedDevice', data);
		getDevices(req, res, function(data){
			app.io.broadcast('devices', data);
		});
	});
});
app.io.route('devices', function(req, res){
	getDevices(req, res, function(data){
		req.io.emit('devices', data);
	});
});
app.io.route('device', function(req, res){
	var id = req.data.id;
	getDevice(id, req, res, function(data){
		req.io.emit('device', data);
	});
});

app.io.route('switchalldevices', function(req, res) {
	var status = req.data.status;
	switchDevices(status, req, res, function(data){
		if(data == 200){
			console.log('Successful: Switch All ' + status);
		}
	});
});
app.io.route('switchdevice', function(req, res){
	// console.log("route: schalte ein Gerät");
	var id = req.data.id;
	var status = req.data.status;
	switchDevice(id, status, req, res, function(data){
		req.io.emit('devices', data);
	});
});

/************
Socket.io routes für Benutzerbearbeitung
*************/
app.io.route('user', function(req, res){
	var id = req.data.id;
	getUser(id, req, res, function(data){
		req.io.emit('user', data);
	});
});
app.io.route('saveUser', function(req, res){
	if( !req.data.id){
		var data = {
			"name": req.data.name,
			"favoritDevices": req.data.favoritDevices
		};
		saveNewUser(data, req, res, function(data){
			req.io.emit('savedUser', data);
			getUsers(req, res, function(data){
				app.io.broadcast('newuser', data);
			});
		});
	}else{
		var data = 
			{
				"id": req.data.id,
				"name": req.data.name,
				"favoritDevices": req.data.favoritDevices
			};
		saveEditUser(data, req, res, function(data){
			getUsers(req, res, function(data){
				app.io.broadcast('newuser', data);
			});
		});
	}
});
app.io.route('deleteUser', function(req, res){
	var id = req.data.id;
	deleteUser(id, req, res, function(data){
		req.io.emit('deletedUser', data);
		getUsers(req, res, function(data){
			app.io.broadcast('newuser', data);
		});
	});
});


app.io.route('rooms', function(req, res){
	getRooms(req, res, function(data){
		req.io.emit('rooms', data);
	});
});
app.io.route('room', function(req, res){
	var id = req.data.id;
	getRoom(id, req, res, function(data){
		req.io.emit('room', data);
	});
});
app.io.route('saveRoom', function(req, res){
	if( !req.data.id){
		var data = {
			"name": req.data.name
		};
		saveNewRoom(data, req, res, function(data){
			req.io.emit('savedRoom', data);
			getRooms(req, res, function(data){
				app.io.broadcast('rooms', data);
			});
		});
	}else{
		var data = 
			{
				"id": req.data.id,
				"name": req.data.name
			};
		saveEditRoom(data, req, res, function(data){
			getRooms(req, res, function(data){
				app.io.broadcast('rooms', data);
			});
		});
	}
});
app.io.route('deleteRoom', function(req, res){
	var id = req.data.id;
	deleteRoom(id, req, res, function(data){
		req.io.emit('deletedRoom', data);
		getRooms(req, res, function(data){
			app.io.broadcast('rooms', data);
		});
	});
});


app.io.route('getSensorvalues', function(req, res){
	var id = req.data.id;
	// var min = req.data.min;
	// var max = req.data.max;
	if(!id){
		console.log("Keine ID");
	}else{
		/*************
		SELECT 
				sensor_data.nodeID 	AS nodeID,
				sensor_data.temp 	AS temp,
				sensor_data.time 	AS datetime
		WHERE
				datetime between ' + min + ' and ' + max + '
		ORDER BY
				datetime
		LIMIT
				0, 5000;
		************************/
		// if(min && max){
			// query = "SELECT nodeID 	AS nodeID, temp AS temp, time 	AS datetime FROM sensor_data WHERE datetime between  " + min + "  and  " + max + " ORDER BY datetime LIMIT 0, 5000;";
			// db.all(query, function(err, data){
				// if(err){
					// console.log(err);
				// }else{
					// var bla = new Array;
					// data.forEach(function(uff){
						// var asd = new Array;
						// asd.push(Math.floor(uff.time));
						// asd.push(parseFloat(uff.temp / 100));
						// bla.push(asd);
					// });
					// var data		= new Object;
					// data.data		= bla;
					// data.nodeID		= data.nodeID;
					
					// req.io.emit('reloadedValues', data);
				// }
			// });
		// }else{
				
			
			
			/**************************
			SELECT
					sensor_data.nodeID 	AS nodeID,
					sensor_data.temp 	AS temp,
					sensors.name 		AS name,
					sensors.linecolor 	AS farbe,
					linetypen.line		AS linetype,
					charttypen.chart	AS charttype
			FROM
					sensor_data,
					sensors,
					linetypen,
					charttypen
			WHERE
					sensors.linetype	== linetypen.id AND
					sensors.charttype	== charttypen.id AND
					sensor_data.nodeID	== sensors.nodeID AND
					1
			GROUP BY
					sensor_data.nodeID
			ORDER BY
					sensor_data.nodeID
			ASC;
			**************************/
			
			query ="SELECT sensor_data.nodeID 	AS nodeID, sensor_data.temp 	AS temp, sensors.name 		AS name, sensors.linecolor 	AS farbe, linetypen.line	AS linetype, charttypen.chart	AS charttype FROM sensor_data, sensors, linetypen, charttypen WHERE sensors.linetype	== linetypen.id AND sensors.charttype	== charttypen.id AND sensor_data.nodeID	== sensors.nodeID AND 1 GROUP BY sensor_data.nodeID ORDER BY sensor_data.nodeID ASC;";
			db.all(query, function(err, sensors){
				if(err){
					console.log(err);
				}else{
					sensors.forEach(function(sensor){
						// console.log(sensor);
						getSensorvalues(sensor.nodeID, req, res, function(data){
							/************************
							Nimmt die Daten aus getSensorvalues und fügt sie in ein Array zusammen:
							[[time,value],[time,value],[time,value],[time,value]]
							************************/
							var bla = new Array;
							data.forEach(function(uff){
								var asd = new Array;
								asd.push(Math.floor(uff.time));
								asd.push(parseFloat(uff.temp / 100));
								bla.push(asd);
							});
							
							/************************
							Fügt die Daten in ein Object zusammen:
							
							{
								"RAUM":{
									data:[[time,value],[time,value],[time,value],[time,value]],
									name: "Raum",
									farbe: "ff00ff",
									nodeID: 1
								}
							}
							und Sendet das Object an die GUI
							************************/
							
							var data		= new Object;
							data.data		= bla;
							data.name		= sensor.name;
							data.farbe		= sensor.farbe;
							data.nodeID		= sensor.nodeID;
							data.linetype	= sensor.linetype;
							data.charttype	= sensor.charttype;
							
							req.io.emit('Sensorvalues', data);
						});
					});
				}
			});
		// }
	}
});

function favoritDevices(data, req, res, callback){
	var favoritDevices = JSON.parse(data.favoritDevices);
	var devices = new Array;

	var bla = new Object;
	var string = "";
	favoritDevices.forEach(function(dev){
		if(string == ""){
			string = " deviceid = " + dev;
		}else{
			string = string + " OR  deviceid = " + dev;
		}
	});
	
	var query = "SELECT devices.name, rooms.name AS Raum, deviceid, buttonLabelOff, buttonLabelOn FROM devices, rooms WHERE devices.room = rooms.id AND ("+ string +");";
	db.all(query , function(err, data) {
		if(err){
			console.log(err);
		}else{
			bla.favoritDevices = data;
			devices.push(bla);
			callback(devices);
		}
	});
}

function getUsers(req, res, callback){
	var query = "SELECT * FROM user;";
	db.all(query, function(err, row){
		if(err){
			console.log(err);
		}else{
			callback(row);
		}
	});
}
function getUser(id, req, res, callback){
	var query = "SELECT * FROM user WHERE id = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		}else if(row == ""){
			callback("Kein Benutzer mit der ID" + id);
			console.log("Kein Benutzer mit der ID" + id);
		}else{
			callback(row);
		}
	});
}
function deleteUser(id, req, res, callback) {
	var query = "SELECT * FROM user WHERE id = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log('Error: ' + err);
			callback('Error: ' + err);
		}else if (row == "") {
			callback("300");
			console.log("Kein User mit der ID");
		} else {
			var query = "DELETE FROM user WHERE id = "+ id +";";
			db.all(query ,function(err,rows){
				if(err){
					console.log('Error: ' + err);
					callback('Error: ' + err);
				}else{
					console.log('Delete User with id: ' + id);
					callback("200");
				}
			});
		}
	});
}
function saveNewUser(data, req, res, callback) {
	var query = "INSERT INTO user ( name, favoritDevices ) VALUES ('"+ data.name +"', '"+ data.favoritDevices +"');";
	console.log(query);
	db.run(query);
	callback(201);
}
function saveEditUser(data, req, res, callback) {
	var query = "UPDATE user SET name = '"+ data.name +"', favoritDevices = '"+ data.favoritDevices +"' WHERE id = '"+ data.id +"';";
	console.log(query);
	db.run(query);
	callback(201);
}


function getDevices(req, res, callback) {
	var query = "SELECT * FROM rooms;";
	var devices = new Array;
	db.all(query, function(err, row){
		if(err){
			console.log(err);
			callback(404);
		}else{
			async.each(row,
				function(row, callback){
					var bla = new Object;
					var query = "SELECT devices.name, rooms.name AS Raum, deviceid, buttonLabelOff, buttonLabelOn, status FROM devices, rooms WHERE room = '" + row.id + "'     AND    devices.room = rooms.id;";
					db.all(query , function(err, data) {
						if(err){
							console.log(err);
						}else{
							bla[row.name] = data;
							devices.push(bla);
							callback();
						}
					});
				},
				function(err){
					if(err){
						console.log(err);
					}else{
						callback(devices);
					}
				}
			);
		}
	});
};
function getDevice(id, req, res, callback) {
	var query = "SELECT * FROM devices WHERE deviceid = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		}else if(row == ""){
			callback("Kein Gerät mit der ID" + id);
			console.log("Kein Gerät mit der ID" + id);
		}else{
			callback(row);
		}
	});
}
function saveNewDevice(data, req, res, callback) {
	var query = "INSERT INTO devices ( name, protocol, buttonLabelOn, buttonLabelOff, CodeOn, CodeOff, room ) VALUES ('"+ data.name +"', '"+ data.protocol +"', '"+ data.buttonLabelOn +"', '"+ data.buttonLabelOff +"', '"+ data.CodeOn +"', '"+ data.CodeOff +"', '"+ data.room +"');";
	console.log(query);
	db.run(query);
	callback(201);
}
function saveEditDevice(data, req, res, callback) {
	var query = "UPDATE devices SET name = '"+ data.name +"', protocol = '"+ data.protocol +"', buttonLabelOn = '"+ data.buttonLabelOn +"', buttonLabelOff = '"+ data.buttonLabelOff +"', CodeOn = '"+ data.CodeOn +"', CodeOff = '"+ data.CodeOff +"', room = '"+ data.room +"' WHERE deviceid = '"+ data.deviceid +"';";
	console.log(query);
	db.run(query);
	callback(201);
}
function deleteDevice(id, req, res, callback) {
	var query = "SELECT * FROM devices WHERE deviceid = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log('Error: ' + err);
			callback('Error: ' + err);
		}else if (row == "") {
			callback("300");
			console.log("Kein Gerät mit der ID");
		} else {
			var query = "DELETE FROM devices WHERE deviceid = "+ id +";";
			db.all(query ,function(err,rows){
				if(err){
					console.log('Error: ' + err);
					callback('Error: ' + err);
				}else{
					console.log('Delete switch with id: ' + id);
					callback("200");
				}
			});
		}
	});
}

function getRooms(req,res, callback){
	var query = "SELECT * FROM rooms;";
	db.all(query, function(err, data){
		if(err){
			console.log(err);
		}else{
			callback(data);
		}
	});
}
function getRoom(id, req, res, callback){
	var query = "SELECT * FROM rooms WHERE id = "+ id +";";
	db.all(query, function(err, data){
		if(err){
			console.log(err);
		}else if(data == ""){
			console.log("Kein Raum mit der ID: " + id);
		}else{
			callback(data);
		}
	});
}
function saveNewRoom(data, req, res, callback) {
	var query = "INSERT INTO rooms ( name) VALUES ('"+ data.name +"');";
	console.log(query);
	db.run(query);
	callback(201);
}
function saveEditRoom(data, req, res, callback) {
	var query = "UPDATE rooms SET name = '"+ data.name +"' WHERE id = '"+ data.id +"';";
	console.log(query);
	db.run(query);
	callback(201);
}
function deleteRoom(id, req, res, callback) {
	var query = "DELETE FROM rooms WHERE id = "+ id +";";
	db.all(query ,function(err,rows){
		if(err){
			console.log('Error: ' + err);
			callback('Error: ' + err);
		}else{
			callback("200");
		}
	});
}

function switchDevice(id, status, req, res, callback) {
	var query = "SELECT * FROM devices WHERE deviceid = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		} else {
			sendToSwitchserver(status, row[0]);
			var query = "UPDATE devices SET status = '"+ status +"' WHERE deviceid = "+ id +";";
			db.run(query);
			sendActiveDevices();
		}
	});
}
function switchDevices(status, req, res, callback) {
	var query = "SELECT * FROM devices;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		} else {
			for( var i=0; i<row.length; i++ ){
				var id = row[i].deviceid;
				var name = row[i].name;
				// Daten an Schaltserver schicken
				sendToSwitchserver(status, row[i]);
				/*
				Status speichern
				*/
				var query = "UPDATE devices SET status = '"+ status +"' WHERE deviceid = "+ id +";";
				db.run(query);
				app.io.broadcast('switchdevice', {
					"id": id,
					"status": status,
					"name": name
				});
				sendActiveDevices();
			}
			callback(200);
		}
	});

}


function sendActiveDevices(){
	var query = "SELECT devices.name, rooms.name AS room FROM devices, rooms WHERE devices.room = rooms.id AND status = 1";
	db.all(query , function(err, activedevices) {
		if (err) {
			console.log(err);
			callback(404);
		}else{
			app.io.broadcast('activedevices', {
				"activedevices": activedevices
			});
		}
	});
}
function getSensorvalues(id, req, res, callback) {
	// console.log(id);
	// console.log(date);
	// if(date == "latest" && id == "all"){
		// // var query = "SELECT place,time,supplyV,temp,hum FROM sensor_values WHERE nodeID='" + id + "' ORDER BY id DESC Limit 1 ;";
		// var query = "SELECT place,time,supplyV,temp,hum FROM sensor_data ORDER BY id DESC Limit 3;";
	// }else if(date == "lastday"){
		// var query = "SELECT place,time,supplyV,temp,hum FROM sensor_data WHERE time >= strftime('%s',datetime('now','-24 hour')) AND time <= strftime('%s','now') AND  nodeID='" + id + "';";
	// }else if(date == "all" && id == "all"){
		// var query = "SELECT place,time,supplyV,temp,hum FROM sensor_data ORDER BY place;";
	// }else if(date == "all" && id == "dia"){
		// var query = "SELECT time, temp FROM sensor_data WHERE nodeID = '"+id+"' GROUP BY  strftime('%Y-%m-%d %H', time / 1000, 'unixepoch', 'localtime');";
		var query = "SELECT time, temp FROM sensor_data WHERE nodeID = '"+id+"';";
	// }else{
		// var query = "SELECT place,time,supplyV,temp,hum,date(time,'unixepoch') AS Date FROM sensor_data WHERE Date='"+ date +"' AND nodeID='" + id + "';";
	// }
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		}else if(row == ""){
			callback("Keine Daten für den Sensor mit der ID" + id);
			console.log("Keine Daten für den Sensor mit der ID" + id);
		}else{
			callback(row);
		}
	});
}
function saveSensorValues(data,req,res,callback){
	/**************************
	{
	"nodeID": 15,
	"supplyV": 2.2,
	"temp":12.3,
	"hum":59
	}
	**************************/
	var now = Math.floor(Date.parse(new Date));
	
	if(data.hum != ""){
		var query = "INSERT INTO sensor_data ( nodeID, supplyV, temp, hum, time) VALUES ('"+ data.nodeID +"', '"+ data.supplyV +"', '"+ data.temp +"', '"+ data.hum +"', '"+ now +"');";
	}else{
		var query = "INSERT INTO sensor_data ( nodeID, supplyV, temp, time) VALUES ('"+ data.nodeID +"', '"+ data.supplyV +"', '"+ data.temp +"', '"+ now +"');";
	}
	// console.log(query);
	db.all(query, function(err, row){
		if(err){
			console.log(err);
		}else{
			callback("200");
		}
	});
};


// JSON API
app.get('/room', function (req, res) {
	getRoomlist(req, res, function(data){
		res.json(data);
	});
});
app.get('/switches', function (req, res) {
	getDevices(req, res, function(data){
		res.json(data);
	});
});
app.get('/switches/:id', function (req, res) {
	getDevice(req, res, function(data){
		res.json(data);
	});
});
app.post('/switches', function (req, res) {
	saveNewDevice(req, res, function(data){
		res.json(data);
	});
});
app.put('/switches/:id', function (req, res) {
	id = req.params.id;
	status = req.body.status;
	switchDevice( id, status, req, res, function(data){
		if(data == 200){
			console.log('Successful: Switch Device with id: ' + id + " to " + status);
			res.json(200);
		}
	});
});
app.put('/switches', function (req, res) {
	status = req.body.status;
	switchDevices( status, req, res, function(data){
		if(data == 200){
			console.log('Successful: Switch Devices ' + status);
			res.json(200);
		}
	});
});
app.delete('/switches/:id', function (req, res) {
	deleteDevice(req, res, function(data){
		res.json(data);
	});
});
app.get('/sensor/:date/:id', function (req, res) {
	var id = req.params.id;
	var date = req.params.date;
	getSensorvalues(id, date, req, res, function(data){
		var bla = new Array;
		data.forEach(function(data){
			var asd = new Array;
			asd.push(data.time * 1000);
			asd.push(parseFloat(data.temp));
			bla.push(asd);
		});
		res.json(bla);
	});
});
app.get('/getUsers', function(req,res){
	getUsers( req, res, function(data){
		res.json(data);
	});
});

app.post('/newdata', function(req, res){
	var data = req.body;
	saveSensorValues(data,req, res, function(request){
		// console.log(request);
		res.json(request);
	});
});
/*************************
curl -i -X POST -H 'Content-Type: application/json' -d '{"nodeID": 15,"supplyV": 2.2,"temp":12.3,"hum":59}' http://192.168.2.47:8000/newdata
curl -i -X POST -H 'Content-Type: application/json' -d '{"nodeID": 15,"supplyV": 2.2,"temp":12.3,"hum":59}' http://192.168.2.47:8000/newdata
**************************/

function sendToSwitchserver( action, data){
	// console.log(data.deviceid);
	var switchserver = {
		ip: "192.168.2.47",
		port: "4040"
	}
	request.post({
		url:'http://192.168.2.47:4040/switch/',
		form:
			{
				status: action,
				device: data
			}
	},function( err, httpResponse, body){
		if(err){
			log("Error: \n Code: 0001 \n Function: sendToSwitchserver", "error");
			log(err, "error");
		}else{
			log("Erfolgreich an den SwitchServer gesendet", "info");
		}
	});
}

function array_key_exists(key, search) {
  if (!search || (search.constructor !== Array && search.constructor !== Object)) {
    return false;
  }
  return key in search;
}
function inArray(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}
function log(msg, type){
/**************************
COLORs Configurieren
**************************/
// colors.setTheme({
  // info: 'green',
  // data: 'grey',
  // help: 'cyan',
  // warn: 'yellow',
  // debug: 'blue',
  // error: 'red'
// });
// console.log("this is a info".info);
// console.log("this is a data".data);
// console.log("this is a help".help);
// console.log("this is a warning".warn);
// console.log("this is a debug".debug);
// console.log("this is an error".error);
	
	switch(type){
		case "info":
			console.log(msg.green);
			break;
		case "data":
			console.log(msg.grey);
			break;
		case "help":
			console.log(msg.blue);
			break;
		case "debug":
			console.log(msg.blue);
			break;
		case "warn":
			console.log(msg.yellow);
			break;
		case "error":
			console.log(msg.red);
			break;
	}
}
log("Test", "warn");
// Start server
app.listen(8000);
log("Server running at http://127.0.0.1:8000/", "info");