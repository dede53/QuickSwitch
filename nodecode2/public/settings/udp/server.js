//###############################################################################################
//## Node.js UDP-AutoDiscovery Server
//###############################################################################################
var PORT = 15000;                           // Server auf Port 15000
var HOST = '0.0.0.0';                       // Server auf allen verfügbaren IPs
var dgram = require('dgram');               // dgram Klasse für UDP-Verbindungen
var server = dgram.createSocket('udp4');     // IPv4 UDP Socket erstellen
//-----------------------------------------------------------------------------------------------
server.bind(PORT, HOST);                     // Den Socket/Server an IP und Port binden
//-----------------------------------------------------------------------------------------------
server.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);
    UDPSend("{Ein,diverser,JSON,String}",remote.address,PORT);
});
//-----------------------------------------------------------------------------------------------
server.on('listening', function () {
    var srvadr = server.address();
    console.log('UDP Server listening on ' + srvadr.address + ":" + srvadr.port);
});
//-----------------------------------------------------------------------------------------------
function UDPSend(message,HOST,PORT)
{
    var client = dgram.createSocket('udp4'); // Neuen Socket zum Client aufbauen
    var message = new Buffer(message);
 
    client.send(message, 0, message.length, PORT, HOST, function(err, bytes) 
    {
        console.log('UDP message sent to ' + HOST +':'+ PORT); // Ausgabe der Nachricht
        client.close(); // Bei erfolgreichen Senden, die Verbindung zum CLient schließen
    });
}
//-----------------------------------------------------------------------------------------------