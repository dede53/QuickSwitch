
var dgram = require('dgram');               // dgram Klasse für UDP-Verbindungen
var client = dgram.createSocket('udp4'); // Neuen Socket zum Client aufbauen
var message = new Buffer('TXP:0,0,10,5600,350,25,1,3,3,1,1,3,3,1,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,3,1,1,3,3,1,1,3,3,1,1,3,3,1,1,3,1,3,1,3,3,1,1,14;');
var PORT = '49880';
var HOST = '192.168.2.27';
client.send(message, 0, message.length, PORT, HOST, function(err, bytes) 
{
	console.log('UDP message sent to ' + HOST +':'+ PORT); // Ausgabe der Nachricht
	client.close(); // Bei erfolgreichen Senden, die Verbindung zum CLient schließen
});
