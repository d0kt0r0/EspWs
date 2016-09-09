process.title = 'EspServer';
var stderr = process.stderr;

// dependencies
var http = require('http');
var url = require('url');
var WebSocket = require('ws');
var express = require('express');

var time = (new Date).getTime()/1000.0;
var beats = 0;
var bpm = 80.0;

var tcpPort = 8002;
var server = http.createServer();
var app = express();
app.use(express.static(__dirname));
server.on('request',app);

var wss = new WebSocket.Server({server: server});
wss.on('connection',function(ws) {
  var ip = ws.upgradeReq.connection.remoteAddress;
  console.log("new WebSocket connection: " + ip);
  ws.on('message',function(m) {
      var n = JSON.parse(m);
      console.log("...message...");
      // respond to 'ping' messages
      if(n.address == "ping") {
        try {
          ws.send(m);
          console.log("ping");
        }
        catch(e) {
          console.log("error responding to ping");
        }
      }

      // respond to 'queryTempo' messages
      else if(n.address == "queryTempo") {
        try {
          var now = (new Date).getTime()/1000.0;
          var remoteNow = n.now + n.travelTime;
          var clockDiff = now - remoteNow;
          var r = JSON.stringify({address:'tempo',time:time-clockDiff,beats:beats,bpm:bpm});
          ws.send(r);
          console.log("queryTempo");
        }
        catch(e) {
          console.log("error responding to queryTempo");
        }
      }

      // respond to 'setTempo' messages
      else if(n.address == "setTempo") {
          var now = new Date().now()/1000.0;
          var remoteNow = n.now + n.travelTime;
          var clockDiff = now - remoteNow;
          time = n.time + clockDiff;
          beats = n.beats;
          bpm = n.bpm;
          console.log("setTempo");
      }

      else console.log("unrecognized address");
    });
});

server.listen(tcpPort, function () { console.log('Listening on ' + server.address().port) });
