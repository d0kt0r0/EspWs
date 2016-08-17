process.title = 'EspServer';
var stderr = process.stderr;

// dependencies
var http = require('http');
var url = require('url');
var WebSocket = require('ws');
var express = require('express');

var time = new Date().now()/1000.0;
var beats = 0;
var bpm = 30.0;

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

      // respond to 'ping' messages
      if(n.address == "ping") {
        try {
          ws.send(m);
        }
        catch(e) {
          console.log("error responding to ping");
        }
      }

      // respond to 'queryTempo' messages
      else if(n.address == "queryTempo") {
        try {
          var now = new Date().now()/1000.0;
          var remoteNow = n.now + n.travelTime;
          var clockDiff = now - remoteNow;
          var r = JSON.stringify({time:time-clockDiff,beats:beats,bpm:bpm});
          ws.send(r);
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
      }
    });
});