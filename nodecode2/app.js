#!/usr/local/bin/node

/*******************************************
Config API

Stellt die Datenbankverbindung her und stellt die Daten als JSON zur verfügung

Aufrufe:

 ############################
 
 Methode:		GET
 URL:			"ip:8000/switches"
 Aktion:		Alle Geräte als JSON-Liste
 
 ############################
 
 Methode:		GET
 URL:			"ip:8000/switches/:id"
 Aktion:		JSON für ein Gerät mit passender ID

 ############################
 
 HEADER:		'Content-Type: application/json'
 Methode:		POST
 POST-DATA:		{ "name": "Lamp 1", "command": "B 1", "status": "0"}
 URL:			"ip:8000/switches"
 Aktion:		fügt ein Gerät zur Datenbank hinzu

 ############################
 
 HEADER:		'Content-Type: application/json'
 Methode:		PUT
 DATA:			{"status": "0"}
 URL:			"ip:8000/switches/:id"
 Aktion:		schaltet ein Gerät
 
 ############################
 
 Methode:		DELETE
 URL:			"ip:8000/switches/:id"
 Aktion:		Löscht ein Gerät

 #############################
 
 HEADER:		'Content-Type: application/json'
 Methode:		PUT
 DATA:			{"status": "0"}
 URL:			"ip:8000/switches"
 Aktion:		schaltet alle Geräte
 
 #############################
*******************************************/


/**
 * Module dependencies.
 */
var request = require('request');
var express = require('express.io');
var app = express().http().io();

// var api = require('./routes/api');


var bodyParser = require('body-parser');
var multer = require('multer');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('abc.db');
// Datenbank anlegen wenn nicht schon geschehen
db.run("CREATE TABLE if not exists [devices] ([deviceid] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,[status] TEXT  NULL,[name] TEXT  NOT NULL,[protocol] TEXT  NOT NULL,[buttonLabelOn] TEXT  NOT NULL,[buttonLabelOff] TEXT  NOT NULL,[CodeOn] TEXT,[CodeOff] TEXT);");


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data




app.use(express.static(__dirname + '/public'));

// Initial web request.
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public');
    // req.io.route('ready');
})

app.get('/devices', function(req, res) {
	res.sendfile(__dirname + '/public/client.html');
})

/**************************************
// app.get('/device', function(req, res) {

	// /********************************
	// Abfrage und Weiterverarbeitung der Daten
	// *********************************

	// request({
		// url: 'http://192.168.2.47:8000/switches/', //URL to hit
		// qs: '', //Query string data
		// method: 'GET', //Specify the method
		// // headers: { //We can define headers too
			// // 'Content-Type': 'MyContentType',
			// // 'Custom-Header': 'Custom Value'
		// // }
	// }, function(error, response, body){
		// if(error) {
			// console.log(error);
		// } else {
			// if(response.statusCode == 200){
				// var code = JSON.parse( body );
				// code.forEach(function(device) {
					// console.log( 'Gerät:');
					// console.log( device);
				// });
			// }else{
				// console.log("Error: Api nicht erreichabar! Fehlercode:" + response.statusCode );
			// }
		// }
	// });
	// res.json("!!!");
	
	// /********************************
	// ENDE
	// *********************************
// });

// app.get('/device/:id', function(req, res) {
	// //Lets configure and request
	// var id = req.params.id;
	// request({
		// url: 'http://192.168.2.47:8000/switches/'+ id,
		// qs: '',
		// method: 'GET',
	// }, function(error, response, body){
		// if(error) {
			// console.log(error);
		// } else {
			// if(response.statusCode == 200){
				// var code = JSON.parse( body );
				// res.json( code);
				// console.log( code);
			// }else{
				// console.log("Error: Api nicht erreichabar! Fehlercode:" + response.statusCode );
			// }
		// }
	// });
	// // res.json("Gelöscht!");
// });

// app.get('/delete/:id', function(req, res) {
	// //Lets configure and request
	// var id = req.params.id;
	// request({
		// url: 'http://192.168.2.47:8000/switches/'+ id,
		// qs: '',
		// method: 'DELETE'
	// }, function(error, response, body){
		// if(error) {
			// console.log(error);
		// } else {
			// if(response.statusCode == 200){
				// console.log( body );
				// res.json( body );
			// }else{
				// console.log("Error: Api nicht erreichabar! Fehlercode:" + response.statusCode );
			// }
		// }
	// });
	// // res.json("Gelöscht!");
// });

// app.get('/new', function(req, res) {
	// request.post({
		// url:'http://192.168.2.47:8000/switches/',
		// form:
			// {
				// name:'Temperatur',
				// protocol:'url',
				// CodeOn:'http://192.168.2.27/?Temperaturen',
				// CodeOff:'http://192.168.2.27/?Lichtleiste_an',
			// }
		// },function(err,httpResponse,body){ 
			// res.json(body);
			// console.log(body);
	// });

// });

// app.get('/switchallon', function(req, res) {
	// request.put({
		// url:'http://192.168.2.47:8000/switches/',
		// form:
			// {
				// status:'1'
			// }
	// },function(err,httpResponse,body){
			// res.json(body);
			// console.log(body);
	// });

// });

// app.get('/switchalloff', function(req, res) {
	// request.put({
		// url:'http://192.168.2.47:8000/switches/',
		// form:
			// {
				// status:'0'
			// }
		// },function(err,httpResponse,body){ 
			// res.json(body);
			// console.log(body);
	// });

// });

**************************************/


app.io.route('switchalldevices', function(req) {
	if(req.data.status == 0){
		var switchstatus = 0;
	}else{
		var switchstatus = 1;
	}
	request.put({
		url:'http://192.168.2.47:8000/switches/',
		form:
			{
				status: switchstatus
			}
	},function(err,httpResponse,body){
		if(err){
			console.log(error);
		}else if(httpResponse.statusCode != 200){
			res.json(body);
			console.log(body);
		}else{
			console.log("Erfolgreich alle ein geschaltet");
		}
	});
});


app.io.route('devices',function (req, res) {
	console.log('Getting switches.');
	// var switches = [];
	var query = "SELECT * FROM devices;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			res.json(404);
		} else {
			res.json(row);
		}
	});
});
/****************
!!!Achtung!!!
Unterschiedliche Temperatur Abfragen gehen noch nicht!!
******************/
function test(){
	console.log('Getting switches.TEST');
	// var switches = [];
	var query = "SELECT * FROM devices;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			console.log(404);
		} else {
			console.log(row);
		}
	});
}
test();
app.io.route('temperature', function (db, res) {
	var id = "15";
	var date = "latest";
	// req.data.status
	if(date == "latest"){
		// var query = "SELECT place,time,supplyV,temp,hum FROM sensor_values WHERE nodeID='" + id + "' ORDER BY id DESC Limit 1 ;";
		var query = "SELECT place,time,supplyV,temp,hum FROM sensor_values ORDER BY id DESC Limit 3;";
	}else if(date == "lastday"){
		var query = "SELECT place,time,supplyV,temp,hum FROM sensor_values WHERE time >= strftime('%s',datetime('now','-24 hour')) AND time <= strftime('%s','now') AND  nodeID='" + id + "';";
	}else{
		var query = "SELECT place,time,supplyV,temp,hum,date(time,'unixepoch') AS Date FROM sensor_values WHERE Date='"+ date +"' AND nodeID='" + id + "';";
	}
	console.log("Kurz vor der DB-Abfrage");
	console.log(db.all);
	// db.all(query , function(err, row) {
		// if (err) {
			// console.log(err);
			// res.json(404);
		// }else if(row == ""){
			// res.json("Keine Daten für den Sensor mit der ID" + id);
			// console.log("Keine Daten für den Sensor mit der ID" + id);
		// }else{
			// res.json(row);
		// }
	// });
});
/*****************************

app.io.route('newuser', function(req) {
	console.log('Ein neuer User!');
    req.io.broadcast('hint', {
        message: 'Ein neuer benutzer!'
    })
});
***************************************/
app.io.route('switchdevice', function (req, res) {
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
});
/*
app.io.route('switchdevice', function(req){
	request.put({
		url:'http://192.168.2.47:8000/switches/'+ req.data.id,
		form:
			{
				status: req.data.status
			}
	},function(err,httpResponse,body){
		if(err){
			console.log(err);
		}else if(httpResponse.statusCode != 200){
			res.json(body);
			console.log(body);
		}else{
			console.log("Erfolgreich "+ req.data.id +" " + req.data.status + " geschaltet");
			app.io.broadcast('switchdevice', {
				"id": req.data.id,
				"status": req.data.status
			});
		}
	});	 

});
*/


// JSON API
app.get('/switches', function (req, res) {
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
});
app.get('/switches/:id', function (req, res) {
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
});
app.post('/switches', function (req, res) {
	var query = "INSERT INTO devices ( name, protocol, buttonLabelOn, buttonLabelOff, CodeOn, CodeOff ) VALUES ('"+ req.body.name +"', '"+ req.body.protocol +"', '"+ req.body.buttonLabelOn +"', '"+ req.body.buttonLabelOff +"', '"+ req.body.CodeOn +"', '"+ req.body.CodeOff +"');";
	console.log(query);
	db.run(query);
	res.send(201);
});
app.put('/switches/:id', function (req, res) {
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
});
app.put('/switches', function (req, res) {
	var query = "SELECT * FROM devices;";
	db.all(query , function(err, row) {
		if (err) {
			console.log(err);
			res.json(404);
		} else {
			console.log('Switch Status of all switches to ' + req.body.status);
			for( var i=0; i<row.length; i++ ){
				var id = row[i].deviceid;
				var query = "UPDATE devices SET status = '"+ req.body.status +"' WHERE deviceid = "+ id +";";
				db.run(query);
			}
		}
	});

  res.send(200);
});
app.delete('/switches/:id', function (req, res) {
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
});
app.get('/sensor/:date/:id', function (req, res) {
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
});


// Letzten Temperaturwert auf abfrage
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
// Start server
app.listen(8000);
console.log("Server running at http://127.0.0.1:8000/");