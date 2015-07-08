//execute commands
var request = require('request');
var exec = require('exec');
var dgram = require('dgram');  
var http = require('http'); 
var util = require('util');
var exec = require('child_process').exec;
var sleep = require('sleep');
// SQLite
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('abc.db');

// Datenbank anlegen wenn nicht schon geschehen
db.run("CREATE TABLE if not exists [devices] ([deviceid] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[status] TEXT  NULL,[name] TEXT  NOT NULL,[protocol] TEXT  NOT NULL,[buttonLabelOn] TEXT  NOT NULL,[buttonLabelOff] TEXT  NOT NULL,[CodeOn] TEXT,[CodeOff] TEXT);");


/*############################

 Methode:		GET
 URL:			"ip:8000/switches"
 Aktion:		Alle Geräte als JSON-Liste

#############################*/
exports.switches = function (req, res) {
	console.log('Getting switches.');
	var switches = [];
	var query = "SELECT * FROM devices;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			res.json(404);
		} else {
			res.json(row);
		}
	});
};

/*############################

 Methode:		GET
 URL:			"ip:8000/switches/:id"
 Aktion:		JSON für ein Gerät mit passender ID

#############################*/
exports.switch = function (req, res) {
	var id = req.params.id;
	var query = "SELECT * FROM devices WHERE deviceid = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			res.json(404);
		}else if(row == ""){
			res.json("Kein Gerät mit der ID" + id);
			console.log("Kein Gerät mit der ID" + id);
		}else{
			res.json(row);
		}
	});
};

/*############################

 HEADER:		'Content-Type: application/json'
 Methode:		POST
 POST-DATA:		{ "name": "Lamp 1", "command": "B 1", "status": "0"}
 URL:			"ip:8000/switches"
 Aktion:		fügt ein Gerät zur Datenbank hinzu

#############################*/
exports.addSwitch = function (req, res) {
	var query = "INSERT INTO devices ( name, protocol, buttonLabelOn, buttonLabelOff, CodeOn, CodeOff ) VALUES ('"+ req.body.name +"', '"+ req.body.protocol +"', '"+ req.body.buttonLabelOn +"', '"+ req.body.buttonLabelOff +"', '"+ req.body.CodeOn +"', '"+ req.body.CodeOff +"');";
	console.log(query);
	db.run(query);
	res.send(201);
};

/*############################

 HEADER:		'Content-Type: application/json'
 Methode:		PUT
 DATA:			{"status": "0"}
 URL:			"ip:8000/switches/:id"
 Aktion:		schaltet ein Gerät

#############################*/
exports.editSwitch = function (req, res) {
	var id = req.params.id;
	var status = req.body.status;
	var query = "SELECT * FROM devices WHERE deviceid = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			res.json(404);
		} else {
			console.log('Switch Status of switch with id: ' + id + " to " + status);
			switchdevice(id, status, row);
			var query = "UPDATE devices SET status = '"+ status +"' WHERE deviceid = "+ id +";";
			db.run(query);
			res.json(200);
		}
	});
};

/*############################

 HEADER:		'Content-Type: application/json'
 Methode:		PUT
 DATA:			{"status": "0"}
 URL:			"ip:8000/switches"
 Aktion:		schaltet alle Geräte

#############################*/
exports.editAllSwitches = function (req, res) {
	var query = "SELECT * FROM devices;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			res.json(404);
		} else {
			console.log('Switch Status of all switches to ' + req.body.status);
			for( var i=0; i<row.length; i++ ){
				var id = row[i].deviceid;
				// console.log(id);
				
				// var script = data[i].script;
				// var command = data[i].command;
				// switchStatus(script,command,req.body.status);
				
				/*
				Status speichern
				*/
				var query = "UPDATE devices SET status = '"+ req.body.status +"' WHERE deviceid = "+ id +";";
				db.run(query);
			}
		}
	});

  res.send(200);
};

/*############################

 Methode:		DELETE
 URL:			"ip:8000/switches/:id"
 Aktion:		Löscht ein Gerät

#############################*/
exports.deleteSwitch = function (req, res) {
	var id = req.params.id;
	var query = "SELECT * FROM devices WHERE deviceid = " + id + ";";
	db.all(query , function(err, row) {
		if (err) {
			console.log('Errorrrr: ' + err);
			res.json('Errorrrr: ' + err);
		}else if (row == "") {
			res.json("300");
			console.log("Kein Gerät mit der ID");
		} else {
			var query = "DELETE FROM devices WHERE deviceid = "+ id +";";
			db.all(query ,function(err,rows){
				if(err){
					console.log('Errorrrr: ' + err);
					res.send('Errorrrr: ' + err);
				}else{
					console.log('Delete switch with id: ' + id);
					res.json("200");
				}
			});
		}
	});
};

/*############################

 Methode:		GET
 URL:			"ip:8000/sensor/:id/:date"
 BSP:			"ip:8000/sensor/15/latest"
	last entry
 
 BSP:			"ip:8000/sensor/15/lastday"
	last 24 hour
 
 BSP:			"ip:8000/sensor/15/2010-03-27"
	all entries from the 27.03.2010 
	
 Aktion:		JSON für ein Sensor mit passender ID und Datum

#############################*/
exports.sensor = function (req, res) {
	var id = req.params.id;
	var date = req.params.date;
	if(date == "latest"){
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
			res.json(404);
		}else if(row == ""){
			res.json("Keine Daten für den Sensor mit der ID" + id);
			console.log("Keine Daten für den Sensor mit der ID" + id);
		}else{
			res.json(row);
		}
	});
};


function switchdevice(id, action, data){
	console.log(data[0].protocol);
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
			console.log("Erfolgreich alle ein geschaltet");
		}
	});
}

/**************************************
// In schaltServer ausgelagert zum Schaltserver

// function switchdevice(id, status, data){
	// console.log(data[0].protocol);
	// switch(data[0].protocol){
		// case "connair":
			// sendUDP(status, data);
			// break;
		// case "console":
			// sendEXEC(status, data);
			// break;
		// case "url":
			// sendURL(status, data);
			// console.log("SWITCH: URL");
			// break;
		// default:
			// console.log('FEHLER!!');
			// console.log(data[0].protocol);
			// break;
	// }
// }

// function sendEXEC(status, data){
	// if(status == 1){
		// var execString = data[0].CodeOn;
	// }else{
		// var execString = data[0].CodeOff;
	// }
	// exec(execString,function(error, stdout, stderr) { 
        // // util.puts(stdout); 
        // console.log(stdout); 
        // console.log("Executing Done");
	// });
	// sleep.sleep(1)//sleep for 1 seconds
// }

// function sendUDP(status, data){
	// if(status == "1"){
		// var msg = new Buffer('TXP:0,0,10,5600,350,25,1,3,3,1,1,3,3,1,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,3,1,1,3,3,1,1,3,3,1,1,3,3,1,1,3,1,3,1,3,3,1,1,14;');
	// }else{
		// var msg = new Buffer('TXP:0,0,10,5600,350,25,1,3,3,1,1,3,3,1,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,3,1,1,3,3,1,1,3,3,1,1,3,3,1,1,3,3,1,1,3,1,3,1,14;');
	// }
	// // dgram Klasse für UDP-Verbindungen
	// var client = dgram.createSocket('udp4'); // Neuen Socket zum Client aufbauen
	// var connair = {
		// port:"49880",
		// ip:"192.168.2.27"
	// }
	// client.send(msg, 0, msg.length, connair.port, connair.ip, function(err, bytes) 
	// {
		// console.log('UDP message sent to ' + connair.ip +':'+ connair.port +'; /n Folgendes wurde gesendet:' + msg); // Ausgabe der Nachricht
		// client.close(); // Bei erfolgreichen Senden, die Verbindung zum CLient schließen
	// });
// }

// function sendURL(status, data){
	// if(status == 1){
		// var msg = data[0].CodeOn;
	// }else{
		// var msg = data[0].CodeOff;
	// }
	// request({
		// url: msg,
		// qs: '',
		// method: 'GET'
	// }, function(error, response, body){
		// if(error) {
			// console.log(error);
		// } else {
				// console.log("Erfolgreich!" + response.statusCode );
		// }
	// });
// }

// function connair_create_msg_brennenstuhl(status, data) {
    // console.log("Create ConnAir Message for Brennenstuhl device='"+ data[0].deviceid +"' action='"+ status +"'");  

    // sA = 0;
    // sG = 0;
    // sRepeat = 10;
    // sPause = 5600;
    // sTune = 350;
    // sBaud = "#baud#";
    // sSpeed = 32;
    // uSleep = 800000;
    // // txversion=3;
    // txversion = 1;
    // HEAD = "TXP:"+ sA +","+ sG +","+ sRepeat +","+ sPause +","+ sTune +","+ sBaud +",";
    // TAIL = ","+ txversion +",1,"+ sSpeed +",;";
    // AN = "1,3,1,3,3";
    // AUS = "3,1,1,3,1";
    // bitLow = 1;
    // bitHgh = 3;
    // seqLow = bitHgh + "," + bitHgh + "," + bitLow + "," + bitLow + ",";
    // seqHgh = bitHgh + "," + bitLow + "," + bitHgh + "," + bitLow + ",";
    // bits = data[0].CodeOn;
    // msg = "";
    // for( i=0; i < bits.length; i++) {   
        // bit = bits.substr(i,1);
        // if(bit=="0") {
            // msg = msg + seqLow;
        // } else {
            // msg = msg + seqHgh;
        // }
    // }
    // msgM = msg;
    // bits= data[0].CodeOff;
    // msg="";
    // for( i=0; i < bits.length; i++) {
        // bit= bits.substr(i,1);
        // if(bit=="0") {
            // msg=msg + seqLow;
        // } else {
            // msg = msg + seqHgh;
        // }
    // }
    // msgS = msg;
    // if(status == 1) {
        // return HEAD + bitLow + "," + msgM + msgS + bitHgh + "," + AN + TAIL;
    // } else {
        // return HEAD + bitLow + "," + msgM + msgS + bitHgh + "," + AUS + TAIL;
    // }
// }
**************************************/


