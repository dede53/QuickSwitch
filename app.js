#!/usr/local/bin/node

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


/**
 * Module dependencies.
 */
 
var express = require('express.io');
var app = express().http().io();

// var api = require('./routes/api');

var request = require('request');
var exec = require('exec');
var dgram = require('dgram');  
var http = require('http'); 
var util = require('util');
var exec = require('child_process').exec;
var sleep = require('sleep');
// var process = require('child_process');

// process.exec('node ../nodecodeschaltserver/app.js', function(error, stdout, stderr){
	   // if (error) {
	     // console.log(error.stack);
	     // console.log('Error code: '+error.code);
	     // console.log('Signal received: '+error.signal);
	   // }
	   // console.log('stdout: ' + stdout);
	   // console.log('stderr: ' + stderr);
// });
	
var bodyParser = require('body-parser');
var multer = require('multer');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('abc.db');

// Datenbank anlegen wenn nicht schon geschehen
db.run("CREATE TABLE if not exists [devices] ([deviceid] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[status] TEXT  NULL,[name] TEXT  NOT NULL,[protocol] TEXT  NOT NULL,[buttonLabelOn] TEXT  NOT NULL,[buttonLabelOff] TEXT  NOT NULL,[CodeOn] TEXT,[CodeOff] TEXT,[room] TEXT);");


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data


app.use(express.static(__dirname + '/public'));

// Initial web request.
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public');
    // req.io.route('ready');
});
app.get('/settings', function(req, res) {
    res.sendfile(__dirname + '/public/settings');
    // req.io.route('ready');
});

app.io.route('saveDevice', function(req, res){
	console.log(req.data);
	
	if( !req.data.deviceid){
		console.log("NEU");
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
			console.log(data);
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
			console.log(data);
		saveEditDevice(data, req, res, function(data){
			req.io.emit('savedEditDevice', data);
			console.log(data);
			getDevices(req, res, function(data){
				app.io.broadcast('devices', data);
			});
		});
	}
});
app.io.route('deleteDevice', function(req, res){
	console.log("io.route: deleteDevice");
	var id = req.data.id;
	deleteDevice(id, req, res, function(data){
		req.io.emit('deletedDevice', data);
		console.log(data);
		getDevices(req, res, function(data){
			app.io.broadcast('devices', data);
		});
	});
});
app.io.route('devices', function(req, res){
	var sort = req.data.sort;
	switch(sort){
		case "rooms":
			getRoomlist(req, res, function(data){
				// console.log(data);
				req.io.emit('roomlist', data);
				// sendActiveDevices();
			});
			break;
		case "devices":
			getDevices(req, res, function(data){
				req.io.emit('devices', data);
				sendActiveDevices();
			});
			break;
	}

});
app.io.route('device', function(req, res){
	var id = req.data.id;
	console.log(id);
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

app.io.route('getSensorvalues', function(req, res){
	// console.log(req);
	var id = req.data.id;
	var date = req.data.date;
	if(!date){
		console.log("Kein Datum!");
	}else if(!id){
		console.log("Keine ID");
	}else{
		getSensorvalues(id, date, req, res, function(data){
			req.io.emit('Sensorvalues', data);
		});
	}
});

function getDevices(req, res, callback) {
	console.log('Getting switches.');
	var query = "SELECT * FROM devices;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		} else {
			callback(row);
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
			//callback(200);
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
				console.log(id);
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
function sendActiveDevices(){
	var query = "SELECT name , room FROM devices WHERE status = 1";
	db.all(query , function(err, activedevices) {
		if (err) {
			console.log(err);
			callback(404);
		}
			console.log(activedevices);
			app.io.broadcast('activedevices', {
				"activedevices": activedevices
			});
	});
}
function getSensorvalues(id, date, req, res, callback) {
	console.log(id);
	console.log(date);
	if(date == "latest" && id == "all"){
		// var query = "SELECT place,time,supplyV,temp,hum FROM sensor_values WHERE nodeID='" + id + "' ORDER BY id DESC Limit 1 ;";
		var query = "SELECT place,time,supplyV,temp,hum FROM sensor_values ORDER BY id DESC Limit 3;";
	}else if(date == "lastday"){
		var query = "SELECT place,time,supplyV,temp,hum FROM sensor_values WHERE time >= strftime('%s',datetime('now','-24 hour')) AND time <= strftime('%s','now') AND  nodeID='" + id + "';";
	}else{
		var query = "SELECT place,time,supplyV,temp,hum,date(time,'unixepoch') AS Date FROM sensor_values WHERE Date='"+ date +"' AND nodeID='" + id + "';";
	}
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
function getRoomlist(req, res, callback){
	var query = "SELECT * FROM devices ORDER BY room ASC;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			callback(404);
		} else {
			callback(row);
		}
	});
}

// JSON API
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
		res.json(data);
	});
});


function sendToSwitchserver( action, data){
	// console.log(data.deviceid);
	request.post({
		url:'http://192.168.2.47:4040/switch/',
		form:
			{
				status: action,
				device: data
			}
	},function(err,httpResponse,body){
		if(err){
			console.log(err);
		}else{
			console.log("Erfolgreich geschaltet!");
		}
	});
}

// Start server
app.listen(8000);
console.log("Server running at http://127.0.0.1:8000/");