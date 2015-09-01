var connair = {
	port:"49880",
	ip:"192.168.2.27"
}

var express = require('express');
var app = express();
var request = require('request');
var exec = require('exec');
var dgram = require('dgram');  
var http = require('http'); 
var util = require('util');
var exec = require('child_process').exec;
var sleep = require('sleep');
var bodyParser = require('body-parser');
var multer = require('multer'); 
var fritz = require('smartfritz');
var piblaster = require('pi-blaster.js');
 
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data

app.post('/switch', function (req, res) {
  switchdevice(req.body.status, req.body.device);
  res.json(200);
});

function switchdevice( status, data){
	switch(data.protocol){
		case "1":
			sendEXEC(status, data);
			break;
		case "2":
			sendURL(status, data);
			break;
		case "3":
			fritzdect(status, data);
			break;
		case "4":
			milight(status, data);
			break;
		case "5":
        case "6":
		case "7":
			sendUDP(status, data);
			break;
        case "8":
            setGPIO(status, data);
            break;
		default:
			console.log('FEHLER!!');
			console.log(data.protocol);
			break;
	}
}

function setGPIO(status, data){
    console.log(status);
    piblaster.setPwm(data.CodeOn, status );
}

function sendEXEC(status, data){
	if(status == 1){
		var execString = data.CodeOn;
	}else{
		var execString = data.CodeOff;
	}
	exec(execString,function(error, stdout, stderr) { 
        // util.puts(stdout); 
        console.log(stdout); 
        console.log("Executing Done");
	});
	sleep.sleep(1)//sleep for 1 seconds
}

function sendUDP(status, data){
	switch(data.protocol){
		case "5":
			var msg = connair_create_msg_brennenstuhl(status, data);
			break;
		case "6":
			var msg = connair_create_msg_elro(status, data);
			break;
		case "7":
			if(status == 1){
				var msg = data.CodeOn;
			}else{
				var msg = data.CodeOff;
			}
			break;
		default:
			break;
	}
	
	// dgram Klasse für UDP-Verbindungen
	var client = dgram.createSocket('udp4'); // Neuen Socket zum Client aufbauen
	client.send(msg, 0, msg.length, connair.port, connair.ip, function(err, bytes) 
	{
		console.log('UDP message sent to ' + connair.ip +':'+ connair.port +'; \nFolgendes wurde gesendet:' + msg); // Ausgabe der Nachricht
		client.close(); // Bei erfolgreichen Senden, die Verbindung zum CLient schließen
	});
}

function sendURL(status, data){
	if(status == 1){
		var msg = data.CodeOn;
	}else{
		var msg = data.CodeOff;
	}
	request({
		url: msg,
		qs: '',
		method: 'GET'
	}, function(error, response, body){
		if(error) {
			console.log(error);
		} else {
			if(response.statusCode == 200){
				console.log( "Erfolgreich die URL aufgerufen" );
			}else{
				console.log( "Die URL meldet keinen gültigen status:" + response.statusCode );
			}
		}
	});
}

function fritzdect(status, data){
	var moreParam = { url:"192.168.2.1" };
	// fritz.getSessionID("user", "password", function(sid){
	fritz.getSessionID("daniel", "hallomarcel", function(sid){
		console.log(sid);
		if(status == 1){
			fritz.setSwitchOn(sid, data.CodeOn, function(sid){
				console.log(sid);
			});
		}else{
			fritz.setSwitchOff(sid, data.CodeOn, function(sid){
				console.log(sid);
			});
		}

	}, moreParam);
}

function milight(status, data){
	var Milight = require('../src/index').MilightController;
	var commands = require('../src/index').commands;

	var light = new Milight({
			ip: "255.255.255.255",
			delayBetweenCommands: 35,
			commandRepeat: 3
		}),
		zone = 1;

	light.sendCommands(commands.rgbw.on(zone), commands.rgbw.brightness(100));
	for (var x=0; x<256; x++) {
		light.sendCommands( commands.rgbw.on(zone), commands.rgbw.hue(x));
	}
	light.pause(1000);
	light.sendCommands(commands.rgbw.on(zone), commands.rgbw.whiteMode(zone));

	light.close();
}

function connair_create_msg_brennenstuhl(status, data) {
    console.log("Create ConnAir Message for Brennenstuhl device='"+ data.deviceid +"' action='"+ status +"'");  

    sA = 0;
    sG = 0;
    sRepeat = 10;
    sPause = 5600;
    sTune = 350;
    sBaud = "#baud#";
    sSpeed = 32;
    uSleep = 800000;
    // txversion=3;
    txversion = 1;
    HEAD = "TXP:"+ sA +","+ sG +","+ sRepeat +","+ sPause +","+ sTune +","+ sBaud +",";
    TAIL = ","+ txversion +",1,"+ sSpeed +",;";
    AN = "1,3,1,3,3";
    AUS = "3,1,1,3,1";
    bitLow = 1;
    bitHgh = 3;
    seqLow = bitHgh + "," + bitHgh + "," + bitLow + "," + bitLow + ",";
    seqHgh = bitHgh + "," + bitLow + "," + bitHgh + "," + bitLow + ",";
    bits = data.CodeOn;
    msg = "";
    for( i=0; i < bits.length; i++) {   
        bit = bits.substr(i,1);
        if(bit=="0") {
            msg = msg + seqLow;
        } else {
            msg = msg + seqHgh;
        }
    }
    msgM = msg;
    bits= data.CodeOff;
    msg="";
    for( i=0; i < bits.length; i++) {
        bit= bits.substr(i,1);
        if(bit=="0") {
            msg=msg + seqLow;
        } else {
            msg = msg + seqHgh;
        }
    }
    msgS = msg;
    if(status == 1) {
        return HEAD + bitLow + "," + msgM + msgS + bitHgh + "," + AN + TAIL;
    } else {
        return HEAD + bitLow + "," + msgM + msgS + bitHgh + "," + AUS + TAIL;
    }
}

function connair_create_msg_elro(status, data) {

    sA=0;
    sG=0;
    sRepeat=10;
    sPause=5600;
    sTune=350;
    sSpeed=14;
    uSleep=800000;
	HEAD = "TXP:"+ sA +","+ sG +","+ sRepeat +","+ sPause +","+ sTune +",25,";
    TAIL = "1,"+ sSpeed +",;";
	
    AN="1,3,1,3,1,3,3,1,";
    AUS="1,3,3,1,1,3,1,3,";
    bitLow=1;
    bitHgh=3;
    seqLow = bitLow + "," + bitHgh + "," + bitLow + "," + bitHgh + ",";
    seqHgh = bitLow + "," + bitHgh + "," + bitHgh + "," + bitLow + ",";
    bits = data.CodeOn;
    msg="";
    for(i=0; i < bits.length; i++) {
        bit = bits.substr(i,1);
        if( bit == "1") {
            msg = msg + seqLow;
        } else {
            msg = msg + seqHgh;
        }
    }
    msgM = msg;
    bits = data.CodeOff;
    msg="";
    for(i=0; i < bits.length; i++) {
        bit = bits.substr(i,1);
        if( bit == "1") {
            msg = msg + seqLow;
        } else {
            msg = msg + seqHgh;
        }
    }
    msgS = msg;
    if( status == 1) {
        return HEAD + msgM + msgS + AN + TAIL;
    } else {
        return HEAD + msgM + msgS + AUS + TAIL;
    }
}

function connair_create_msg_intertechno(status, data) {

    sA=0;
    sG=0;
    sRepeat=12;
    sPause=11125;
    sTune=89;
    sSpeed=32; //erfahrung aus dem Forum auf 32 stellen http://forum.power-switch.eu/viewtopic.php?f=15&t=146
    uSleep=800000;
	HEAD = "TXP:"+ sA +","+ sG +","+ sRepeat +","+ sPause +","+ sTune +",25,";
    TAIL = "1,"+ sSpeed +",;";
    AN="12,4,4,12,12,4";
    AUS="12,4,4,12,4,12";
    bitLow=4;
    bitHgh=12;
    seqLow = bitHgh + "," + bitHgh + "," + bitLow + "," + bitLow + ",";
    seqHgh = bitHgh + "," + $bitLow + "," + bitHgh + "," + bitLow + ",";
    msgM="";
    switch (data.CodeOn.toUpperCase()) {
        case "A":
            msgM = seqHgh + seqHgh + seqHgh + seqHgh;
            break;
        case "B":
            msgM + seqLow + seqHgh + seqHgh + seqHgh;
            break;   
        case "C":
            msgM + seqHgh + seqLow + seqHgh + seqHgh;
            break; 
        case "D":
            msgM + seqLow + seqLow + seqHgh + seqHgh;
            break;
        case "E":
            msgM + seqHgh + seqHgh + seqLow + seqHgh;
            break;
        case "F":
            msgM + seqLow + seqHgh + seqLow + seqHgh;
            break;
        case "G":
            msgM + seqHgh + seqLow + seqLow + seqHgh;
            break;
        case "H":
            msgM + seqLow + seqLow + seqLow + seqHgh;
            break;
        case "I":
            msgM + seqHgh + seqHgh + seqHgh + seqLow;
            break;
        case "J":
            msgM + seqLow + seqHgh + seqHgh + seqLow;
            break;
        case "K":
            msgM + seqHgh + seqLow + seqHgh + seqLow;
            break;
        case "L":
            msgM + seqLow + seqLow + seqHgh + seqLow;
            break;
        case "M":
            msgM + seqHgh + seqHgh + seqLow + seqLow;
            break;
        case "N":
            msgM + seqLow + seqHgh + seqLow + seqLow;
            break;
        case "O":
            msgM + seqHgh + seqLow + seqLow + seqLow;
            break;
        case "P":
            msgM + seqLow + seqLow + seqLow + seqLow;
            break;
    }
    msgS="";   
    switch (data.CodeOff){
        case "1":
            msgS = seqHgh + seqHgh + seqHgh + seqHgh;
            break;
        case "2":
            msgS = seqLow + seqHgh + seqHgh + seqHgh;
            break;   
        case "3":
            msgS = seqHgh + seqLow + seqHgh + seqHgh;
            break; 
        case "4":
            msgS = seqLow + seqLow + seqHgh + seqHgh;
            break;
        case "5":
            msgS = seqHgh + seqHgh + seqLow + seqHgh;
            break;
        case "6":
            msgS = seqLow + seqHgh + seqLow + seqHgh;
            break;
        case "7":
            msgS = seqHgh + seqLow + seqLow + seqHgh;
            break;
        case "8":
            msgS = seqLow + seqLow + seqLow + seqHgh;
            break;
        case "9":
            msgS = seqHgh + seqHgh + seqHgh + seqLow;
            break;
        case "10":
            msgS = seqLow + seqHgh + seqHgh + seqLow;
            break;
        case "11":
            msgS = seqHgh + seqLow + seqHgh + seqLow;
            break;
        case "12":
            msgS = seqLow + seqLow + seqHgh + seqLow;
            break;
        case "13":
            msgS = seqHgh + seqHgh + seqLow + seqLow;
            break;
        case "14":
            msgS = seqLow + seqHgh + seqLow + seqLow;
            break;
        case "15":
            msgS = seqHgh + seqLow + seqLow + seqLow;
            break;
        case "16":
            msgS = seqLow + seqLow + seqLow + seqLow;
            break;
    }
    if(status == "ON") {
        return HEAD + bitLow + "," + msgM + msgS + seqHgh + seqLow + bitHgh + "," + AN + TAIL;
    } else {
        return HEAD + bitLow + "," + msgM + msgS + seqHgh + seqLow + bitHgh + "," + AUS + TAIL;
    }
}

app.listen(4040);
console.log("Server running at http://127.0.0.1:4040");