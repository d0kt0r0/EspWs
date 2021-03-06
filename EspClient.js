EspClient = function (url,ac) {
  this.url = url;
  this.ac = ac;
  this.wsReady = false;
  this.pingCount = 0;
  this.travelTimes = new Array(0);
  this.connect();
  var closure = this;
  setInterval(function() {
    closure.sendPing();
  },1000+(Math.floor(Math.random()*1000)));
}

EspClient.prototype.connect = function () {
  console.log("EspClient: opening websocket connection to " + this.url + "...");
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  var closure = this;
  try {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = function () {
      console.log("EspClient: websocket connection opened");
      closure.wsReady = true;
    };
    this.ws.onerror = function () {
      console.log("EspClient: websocket error");
      closure.wsReady = false;
    };
    this.ws.onclose = function () {
      console.log("EspClient: websocket closed (retrying in 1 second)");
      closure.wsReady = false;
      closure.ws = null;
      setTimeout(function() {
        closure.connect();
      },1000);
    };
    this.ws.onmessage = function (m) {
      closure.onMessage(m);
    }
  }
  catch(e) {
    console.log("disregarding exception in new WebSocket (retry in 1 second)");
    setTimeout(function() {
      closure.connect();
    },1000);
  }
}

EspClient.prototype.setUrl = function(url) {
  if(url == this.url) return;
  if(this.wsReady) {
    this.close();
  }
  this.url = url;
}


EspClient.prototype.onMessage = function(m) {
  if(m.data == null) {
    console.log("EspClient: null data");
    return;
  }
  var msg = JSON.parse(m.data);
  if(msg.address == null) {
    console.log("EspClient: no address");
    return;
  }
  else if(msg.address == 'ping') this.receivedPing(msg);
  else if(msg.address == 'tempo') this.receivedTempo(msg);
  else {
    console.log("EspClient: unrecognized address");
  }
}

EspClient.prototype.send = function(o) {
  if(!this.wsReady)return;
  try {
    this.ws.send(JSON.stringify(o));
  }
  catch(e) {
    console.log("EspClient: warning - exception in websocket send");
  }
}


EspClient.prototype.sendPing = function () {
  this.pingCount = this.pingCount + 1;
  if(this.pingCount > 65535) this.pingCount = 0;
  var now = this.ac.currentTime;
  this.send({ address:'ping',count:this.pingCount,now:now});
  console.log("sent ping");
  this.lastPingTime = now;
  this.sendQueryTempo();
}

EspClient.prototype.receivedPing = function (m) {
  var now = this.ac.currentTime;
  if(typeof m.count != 'number') {
    console.log("EspClient: missing/invalid count");
    return;
  }
  if(m.count != this.pingCount) {
    console.log("EspClient: warning - mismatched ping count");
    return;
  }
  if(typeof m.now != 'number') {
    console.log("EspClient: missing/invalid time");
    return;
  }
  this.travelTimes.push((now - m.now)/2);
  if(this.travelTimes.length >= 5) { // start reporting after 5 measurements
    var sum = 0;
    for(var n=0;n<this.travelTimes.length;n++) sum = sum + this.travelTimes[n];
    this.travelTime = sum/this.travelTimes.length;
    console.log("EspClient: new travelTime estimate is " + this.travelTime);
  }
  if(this.travelTimes.length >= 16) { // average over 5-16 measurements
    this.travelTimes.shift();
  }
}

EspClient.prototype.sendQueryTempo = function () {
  if(typeof this.travelTime != 'number') return;
  var now = this.ac.currentTime;
  this.send({ address:'queryTempo',travelTime:this.travelTime,now:now});
}

EspClient.prototype.receivedTempo = function (m) {
  // the tempo is described as:
  // time - a time point
  // beats - number of beats at that time point
  // bpm - the number of beats per minute
  // the server sends these values to us pre-adjusted into its estimate of our
  // local time frame (i.e. the time frame of the provided audio context).
  if(typeof m.time != 'number') {
    console.log("EspClient: received tempo without time");
    return;
  }
  if(typeof m.beats != 'number') {
    console.log("EspClient: received tempo without beats");
    return;
  }
  if(typeof m.bpm != 'number') {
    console.log("EspClient: received tempo without bpm");
    return;
  }
  this.tempo = {time:m.time,beats:m.beats,bpm:m.bpm};
  if(typeof this.tempoCallback == 'function') this.tempoCallback(this.tempo);
}

EspClient.prototype.sendSetTempo = function (x) {
  if(typeof x.time != 'number') throw Error("EspClient: no time in setTempo");
  if(typeof x.beats != 'number') throw Error("EspClient: no beats in setTempo");
  if(typeof x.bpm != 'number') throw Error("EspClient: no bpm in setTempo");
  if(typeof this.travelTime != 'number') return;
  var now = this.ac.currentTime;
  this.send({address:'setTempo',time:x.time,beats:x.beats,bpm:x.bpm,now:now,travelTime:this.travelTime});
  this.tempo = x;
}
