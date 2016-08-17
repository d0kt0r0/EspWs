EspClient = function (url) {
  this.url = url;
  this.wsReady = false;
  this.connect();
}

EspClient.prototype.connect = function () {
  console.log("EspClient: opening websocket connection to " + this.url + "...");
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  var closure = this;
  this.ws = new WebSocket(url);
  this.ws.onopen = function () {
    console.log("EspClient: websocket connection opened");
    this.wsReady = true;
  };
  this.ws.onerror = function () {
    console.log("EspClient: websocket error");
    this.wsReady = false;
  };
  this.ws.onclose = function () {
    console.log("EspClient: websocket closed (retrying in 5 seconds)");
    this.wsReady = false;
    this.ws = null;
    setTimeOut(function() {
      closure.connect();
    },5000);
  };
  this.ws.onmessage = function (m) {
    closure.onMessage(m);
  }
}

EspClient.prototype.onMessage = function(m) {
  if(m.data == null) {
    console.log("EspClient: null data");
    return;
  }
  var msg = JSON.parse(m.data);
  if(msg.address == null) {
    console.log("EspClient: no address");
  }
  if(msg.address == 'remoteAck') {
    if(typeof msg.time != 'number') {
      console.log("EspClient: missing/invalid time");
      return;
    }
    if(typeof msg.)
  }

}
