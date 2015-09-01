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

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('abc.db');

 
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
var colors = require('colors/safe');
var cookies = new Object;

	var switchserver = {
		ip: "192.168.2.47",
		port: "4040"
	}
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




// Datenbank anlegen wenn nicht schon geschehen
// db.run("CREATE TABLE if not exists [devices] ([deviceid] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[status] TEXT  NULL,[name] TEXT  NOT NULL,[protocol] TEXT  NOT NULL,[buttonLabelOn] TEXT  NOT NULL,[buttonLabelOff] TEXT  NOT NULL,[CodeOn] TEXT,[CodeOff] TEXT,[room] TEXT);");
// db.run("");


// Tabelle für Geräte anlegen
db.run("CREATE TABLE if not exists [devices] ([deviceid] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[status] TEXT  NULL,[name] TEXT  NOT NULL,[protocol] TEXT  NOT NULL,[buttonLabelOn] TEXT  NOT NULL,[buttonLabelOff] TEXT  NOT NULL,[CodeOn] TEXT,[CodeOff] TEXT,[roomid] TEXT);");

// Tabelle für Diagrammtypen anlegen
db.run("CREATE TABLE if not exists [charttypen] ([id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[name] VARCHAR(30)  UNIQUE NOT NULL,[chart] VARCHAR(20)  UNIQUE NOT NULL);");

// Tabelle für Linientypen anlegen
db.run("CREATE TABLE if not exists [linetypen] ([id] INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,[name] VARCHAR(30)  UNIQUE NOT NULL,[line] VARCHAR(20)  UNIQUE NOT NULL);");

// Tabelle für Nachrichten anlegen
db.run("CREATE TABLE if not exists [messages] ([id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[time] VARCHAR(20)  NULL,[type] INTEGER  NOT NULL,[author] VARCHAR(20)  NOT NULL,[message] VARCHAR(400)  NOT NULL);");

// Tabelle für Benachrichtigungstypen anlegen
db.run("CREATE TABLE if not exists [messagetypen] ([id] INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,[type] VARCHAR(20)  UNIQUE NOT NULL);");

// Tabelle für Räume anlegen
db.run("CREATE TABLE if not exists [rooms] ([id] INTEGER  NOT NULL PRIMARY KEY,[name] TEXT  NOT NULL);");

// Tabelle für Sensordaten anlegen
db.run("CREATE TABLE if not exists [sensor_data] ([id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[time] VARCHAR(20)  NULL,[nodeID] INTEGER  NULL,[supplyV] VARCHAR(20)  NULL,[temp] VARCHAR(20)  NULL,[hum] VARCHAR(20)  NULL);");

// Tabelle für Sensoren anlegen
db.run("CREATE TABLE if not exists [sensors] ([id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[nodeID] VARCHAR(20)  NULL,[charttype] VARCHAR(10)  NULL,[linetype] VARCHAR(10)  NULL,[name] VARCHAR(50)  NULL,[description] VARCHAR(300)  NULL,[linecolor] VARCHAR(6)  NULL,[visibility] INTEGER(10)  NULL);");

// Tabelle für Benutzer anlegen
db.run("CREATE TABLE if not exists [user] ([id] INTEGER  PRIMARY KEY NOT NULL,[name] TEXT  NULL,[anwesend] INTEGER  NULL,[password] VARCHAR(20)  NULL,[favoritDevices] VARCHAR(900)  NULL);");

// Tabelle für Countdowns anlegen
db.run("CREATE TABLE if not exists [countdowns] ([id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[type] VARCHAR(20)  NOT NULL,[time] VARCHAR(20)  NOT NULL,[switchid] INTEGER  NOT NULL,[status] INTEGER  NOT NULL);");


db.run("CREATE TABLE if not exists [countdowntypen] ([id] INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,[type] VARCHAR(20)  UNIQUE NOT NULL);");


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
	sendActiveDevices(function(err){
		if(err != 200){
			console.log("Error: Liste der aktiven Geräte konnte nicht gesendet werden" + err);
		}
	});
	var now = Math.floor(Date.parse(new Date));
	loadOldMessages( now, function(data){
		req.io.emit('oldMessages', data);
	});
	getCountdowns(req, res, function(data){
		req.io.emit('countdowns', data);
	});
	/*
*/
	getDevices('array',req, res, function(data){
		req.io.emit('devices', data);
	});
});
app.io.route('saveDevice', function(req, res){
	if( !req.data.deviceid){
		var data = {
			"name": req.data.name,
			"buttonLabelOn": req.data.buttonLabelOn,
			"buttonLabelOff": req.data.buttonLabelOff,
			"CodeOn": req.data.CodeOn,
			"CodeOff": req.data.CodeOff,
			"protocol": req.data.protocol,
			"room": req.data.room
		};
		saveNewDevice(data, req, res, function(data){
			getDevices('object', req, res, function(data){
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
				"protocol": req.data.protocol,
				"room": req.data.room
			};
		saveEditDevice(data, req, res, function(data){
			getDevices('object',req, res, function(data){
				app.io.broadcast('devices', data);
			});
		});
	}
});
app.io.route('deleteDevice', function(req, res){
	var id = req.data.id;
	deleteDevice(id, req, res, function(data){
		req.io.emit('deletedDevice', data);
		getDevices('object',req, res, function(data){
			app.io.broadcast('devices', data);
		});
	});
});
app.io.route('devices', function(req, res){
	var type = req.data.type;
	getDevices(type,req, res, function(data){
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
	console.log(status);
	switchDevices(status, req, res, function(err){
		if(err == 200){
			console.log('Erfolgreich alle ' + status + ' geschaltet');
		}else{
			console.log(err);
		}
	});
});
app.io.route('switchdevice', function(req, res){
	var id = req.data.id;
	var status = req.data.status;
	switchDevice(id, status, req, res, function(err){
		if(err != 200){
			console.log("Gerät konnte nicht geschaltet werden");
		}
	});
});
app.io.route('switchRoom', function(req, res){
	var room = req.data.room;
	var status = req.data.status;
	switchRoom(room, status, req, res, function(err){
		if(err != 200){
			console.log("Raum konnte nicht geschaltet werden");
		}
	});
});


/************
Socket.io routes für Benutzerbearbeitung
*************/
app.io.route('user', function(req, res){
	var id = req.data.id;
	getUser(id, req, res, function(data){
		console.log(data);
		req.io.emit('user', data);
	});
});
app.io.route('saveUser', function(req, res){
	if( !req.data.id){
		var data = {
			"name": req.data.name,
			"favoritDevices": req.data.favoritDevices
		};
		saveNewUser(data, req, res, function(response){
			req.io.emit('savedUser', response);
			getUsers(req, res, function(user){
				app.io.broadcast('newuser', user);
			});
		});
	}else{
		var data = 
			{
				"id": req.data.id,
				"name": req.data.name,
				"favoritDevices": req.data.favoritDevices
			};
			console.log(data);
		saveEditUser(data, req, res, function(response){
			getUsers(req, res, function(user){
				app.io.broadcast('newuser', user);
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

app.io.route('newLinkMessage', function(req){
	req.data.time = Math.floor(Date.parse(new Date));
	app.io.broadcast('newLinkMessage', req.data);
	saveMessage(req.data, function(data){
		if(data != "200"){
			log("Nachricht konnte nicht gespeichert werden!", "error");
			log( data , "error");
		}
	});
});
app.io.route('loadOldMessages', function(req){
	loadOldMessages(req.data, function(data){
		req.io.emit('oldMessages', data);
	});
});

app.io.route('countdowns', function(req, res){
	getCountdowns(req, res, function(data){
		req.io.emit('countdowns', data);
	});
});

app.io.route('newCountdowntimer', function(req){
	data = req.data;
	data.settime = Math.floor(Date.parse(new Date));

	data.time = data.settime + (data.time * 60000);
	// data.device.name
	// data.name
	app.io.broadcast('newCountdown', data);
	setNewCountdown(req.data, function(data){
		if(data != "200"){
			log("Nachricht konnte nicht gespeichert werden!", "error");
			log( data , "error");
		}
	});
/*
*/
});
app.io.route('deleteCountdown', function(req, res){
	var id = req.data.id;
	deleteCountdown(id, req, res, function(data){
		getCountdowns(req, res, function(data){
			app.io.broadcast('countdowns', data);
		});
	});
});

app.io.route('getSensorvalues', function(req, res){
	var id = req.data.id;
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
	var devices = new Object;
	var string = "";
	favoritDevices.forEach(function(dev){
		if(string == ""){
			string = " deviceid = " + dev;
		}else{
			string = string + " OR  deviceid = " + dev;
		}
	});
	
	// var query = "SELECT devices.name, rooms.name AS room, status, deviceid, buttonLabelOff, buttonLabelOn FROM devices, rooms WHERE devices.roomid = rooms.id AND ("+ string +");";
	var query = "SELECT devices.*, rooms.name AS room FROM devices, rooms WHERE devices.roomid = rooms.id AND ("+ string +");";
	db.all(query , function(err, data) {
		if(err){
			console.log(err);
		}else{
			data.forEach(function(device){
				devices[device.deviceid] = device;
			});
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
	var query = "INSERT INTO user ( name, favoritDevices ) VALUES ('"+ data.name +"', '["+ data.favoritDevices +"]');";
	db.run(query);
	callback(201);
}
function saveEditUser(data, req, res, callback) {
	var query = "UPDATE user SET name = '"+ data.name +"', favoritDevices = '["+ data.favoritDevices +"]' WHERE id = '"+ data.id +"';";
	console.log(query);
	db.run(query);
	callback(201);
}

function getCountdowns(req,res,callback){
	var query = "SELECT countdowns.id, countdowntypen.type, countdowns.switchid, countdowns.time, countdowns.status AS switchstatus FROM countdowns, countdowntypen;";
	db.all(query, function(err, row){
		if(err){
			console.log(err);
		}else{
			var bla = new Array;
			async.each(row,
				function(row, callback){
					getDevice(row.switchid, req, res, function(device){
						row.device = device[0];
						bla.push(row);
						callback();
					});
				},
				function(err){
					if(err){
						console.log(err);
					}else{
						callback(bla);
					}
				}
			);
		}
	});
}
function deleteCountdown(id, req, res, callback) {
	var query = "SELECT * FROM countdowns WHERE id = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log('Error: ' + err);
			callback('Error: ' + err);
		}else if (row == "") {
			callback("300");
			console.log("Kein Countdown mit der ID");
		} else {
			var query = "DELETE FROM countdowns WHERE id = "+ id +";";
			db.all(query ,function(err,rows){
				if(err){
					console.log('Error: ' + err);
					callback('Error: ' + err);
				}else{
					console.log('Delete Countdown with id: ' + id);
					callback("200");
				}
			});
		}
	});
}
function setNewCountdown(data, callback){	
	var query = "INSERT INTO countdowns (type, time, switchid, status) VALUES ('1','"+ data.time +"','"+ data.device.deviceid +"','"+ data.switchstatus +"');";
	db.all(query, function(err, data){
		if(err){
			callback(err);
		}else{
			callback("200");
		}
	});
	/*
*/
}

function getDevices(type, req, res, callback) {
	var query = "SELECT * FROM rooms;";
	if(type == "object"){
		var uff = new Object;
	}else{
		var uff = new Array;
	}
	db.all(query, function(err, row){
		if(err){
			console.log(err);
			callback(404);
		}else{
			async.each(row,
				function(row, callback){
					var query = "SELECT rooms.name AS Raum, devices.* FROM devices, rooms WHERE devices.roomid = '" + row.id + "'     AND    devices.roomid = rooms.id;";
					db.all(query , function(err, data) {
						if(err){
							console.log(err);
						}else{
							if(type == "object"){
								uff[row.name] = new Object;
								data.forEach(function(dat){
									uff[row.name][dat.deviceid] = dat;								
								});
							}else{
								// uff[row.name] = new Array;
								data.forEach(function(dat){
									uff.push(dat);							
								});
								
							}
							callback();
						}
					});
				},
				function(err){
					if(err){
						console.log(err);
					}else{
						callback(uff);
					}
				}
			);
		}
	});
};
function getDevice(id, req, res, callback) {
	var query = "SELECT devices.*, rooms.name AS Raum FROM devices, rooms WHERE devices.roomid = rooms.id AND devices.deviceid = " + id + ";";
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
	var query = "INSERT INTO devices ( name, protocol, buttonLabelOn, buttonLabelOff, CodeOn, CodeOff, roomid ) VALUES ('"+ data.name +"', '"+ data.protocol +"', '"+ data.buttonLabelOn +"', '"+ data.buttonLabelOff +"', '"+ data.CodeOn +"', '"+ data.CodeOff +"', '"+ data.room +"');";
	db.run(query);
	callback(201);
}
function saveEditDevice(data, req, res, callback) {
	var query = "UPDATE devices SET name = '"+ data.name +"', protocol = '"+ data.protocol +"', buttonLabelOn = '"+ data.buttonLabelOn +"', buttonLabelOff = '"+ data.buttonLabelOff +"', CodeOn = '"+ data.CodeOn +"', CodeOff = '"+ data.CodeOff +"', roomid = '"+ data.room +"' WHERE deviceid = '"+ data.deviceid +"';";
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

function switchRoom(room, status, req, res, callback){
	var query = "SELECT deviceid, status, devices.name, protocol, buttonLabelOff, buttonLabelOn, CodeOn, CodeOff,devices.roomid, rooms.name AS Raum FROM devices, rooms WHERE roomid = '" + room.id + "' AND devices.roomid = rooms.id;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		} else {
			row.forEach(function(device){
				sendToSwitchserver(req, status, device);
			});
			var query = "UPDATE devices SET status = '"+ status +"' WHERE roomid = "+ room.id +";";
			db.run(query);
			callback(200);
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

function saveMessage(data, callback){
	var query = "INSERT INTO messages (time, type, author, message) VALUES ('"+ data.time +"','"+ data.type +"','"+ data.author +"','"+ data.message +"');";
	db.all(query, function(err, data){
		if(err){
			callback(err);
		}else{
			callback("200");
		}
	});
}
function sendMessages(callback){
	// var query = "SELECT time(time/1000, 'unixepoch', 'localtime') AS time, type, author, message FROM messages WHERE time >=  (strftime('%s', datetime( 'now','-24 hour'))* 1000) AND time <=  strftime('%s','now') * 1000;";
	var query = "SELECT time, type, author, message FROM messages WHERE time >=  (strftime('%s', datetime( 'now','-24 hour'))* 1000) AND time <=  strftime('%s','now') * 1000;";
	db.all(query , function(err, messages) {
		if (err) {
			console.log(err);
			callback(404);
		}else{
			callback(messages);
		}
	});
}
function loadOldMessages(data, callback){
	var query = "SELECT * FROM messages LIMIT 1;";
	db.all(query , function(err, latest) {
		if (err || latest == "") {
			console.log("Fehler beim auslesen der letzten Nachricht, oder keine Nachricht in der Datenbank");
			console.log(latest);
			console.log(err);
		}else{
			var query = "SELECT time, type, author, message FROM messages WHERE time < "+ data +" AND time >=  (strftime('%s', datetime(("+ data +" /1000), 'unixepoch' ,'-24 hour'))* 1000) ORDER BY time DESC;";
			db.all(query , function(err, messages) {
				if (err) {
					console.log(err);
					// callback(404);
				}else{
					var messagesToSend = new Object;
					messagesToSend.messages = messages;
					messagesToSend.timestamp = data;
					if(data <= latest[0].time){
						messagesToSend.moreMessagesAvible = false;
					}else{
						messagesToSend.moreMessagesAvible = true;
					}
					callback(messagesToSend);
					// if(messages == ""){							
						
					// }else{
						
					// }
				}
			});
		}
	});
}

function switchDevice(id, status, req, res, callback) {
	var query = "SELECT deviceid, status, devices.name, protocol, buttonLabelOff, buttonLabelOn, CodeOn, CodeOff,devices.roomid, rooms.name AS Raum FROM devices, rooms WHERE deviceid = '" + id + "' AND devices.roomid = rooms.id;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		} else {
			sendToSwitchserver(req, status, row[0]);
			var query = "UPDATE devices SET status = '"+ status +"' WHERE deviceid = "+ id +";";
			db.run(query);
			callback(200);
		}
	});
}
function switchDevices(status, req, res, callback) {
	var query = "SELECT * FROM devices WHERE status != " + status + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		} else {
			console.log(row);
			row.forEach(function(device){
				sendToSwitchserver(req, status, device);
				var query = "UPDATE devices SET status = '"+ status +"' WHERE deviceid = "+ device.deviceid +";";
				db.run(query);
			});
			callback(200);
		}
	});

}


function sendActiveDevices(callback){
	var query = "SELECT devices.name, rooms.name AS room FROM devices, rooms WHERE devices.roomid = rooms.id AND status != 0;";
	db.all(query , function(err, activedevices) {
		if (err) {
			console.log(err);
			callback(404);
		}else{
			app.io.broadcast('activedevices', {
				"activedevices": activedevices
			});
			callback(200);
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
	db.all(query, function(err, row){
		if(err){
			console.log(err);
		}else{
			callback("200");
		}
	});
};

function editSetting(name, value){
	var query = "UPDATE settings SET " + name + " = '"+ value +"' ;";
	db.run(query);
	// db.all(query, function(err, row){
		// if(err){
			// console.log(err);
		// }else{
			
		// }
	// });
}
// function loadSettings(callback){
function loadSetting(name, callback){
	var query = "SELECT * FROM settings WHERE name = " + name;
	db.all(query, function(err, row){
		if(err){
			console.log("Kann die Einstellungen nicht aus der Datenbank laden!");
			console.log(err);
		}else{
			callback(row);
			console.log(row);
		}
	});
}

// JSON API
app.get('/room', function (req, res) {
	getRoomlist(req, res, function(data){
		res.json(data);
	});
});
app.get('/switches', function (req, res) {
	getDevices('object',req, res, function(data){
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
		res.json(request);
	});
});
/*************************
curl -i -X POST -H 'Content-Type: application/json' -d '{"nodeID": 15,"supplyV": 2.2,"temp":12.3,"hum":59}' http://192.168.2.47:8000/newdata
curl -i -X POST -H 'Content-Type: application/json' -d '{"nodeID": 15,"supplyV": 2.2,"temp":12.3,"hum":59}' http://192.168.2.47:8000/newdata
**************************/

function sendToSwitchserver(req, action, data, switchserver){

	log(action , "info");
	if(data.protocol == 8){
		req.io.broadcast('switchDevice', {"device":data,"status":action});
	}else{
		app.io.broadcast('switchDevice', {"device":data,"status":action});
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
			log("Error! \n SwitchServer ist nicht erreichbar!", "error");
			log("Sicher das du den SwitchServer gestartet hast?", "info");
			log( err , "error");
		}else{
			log("Erfolgreich an den SwitchServer gesendet", "info");
			sendActiveDevices(function(err){
				if(err != 200){
					console.log("Error: Liste der aktiven Geräte konnte nicht gesendet werden" + err);
				}
			});
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
var now = new Date;
var datum =  now.getDate() + ":" + (now.getMonth() + 1) + ":" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
	switch(type){
		case "info":
			console.log(datum +': '+ colors.green(msg));
			break;
		case "data":
			console.log(datum +': '+ colors.grey(msg));
			break;
		case "help":
			console.log(datum +': '+ colors.blue(msg));
			break;
		case "debug":
			console.log(datum +': '+ colors.blue(msg));
			break;
		case "warn":
			console.log(datum +': '+ colors.yellow(msg));
			break;
		case "error":
			console.log(datum +': '+ colors.red(msg));
			break;
	}
}


// Start server
app.listen(8000);
log("Server running at http://127.0.0.1:8000/", "info");