
/**
 * Module dependencies.
 */

 var express = require('express');
 var routes = require('./routes');
 var user = require('./routes/user');
 var http = require('http');
 var path = require('path');
 var app = express();
 var server = http.createServer(app);
 var io = require('socket.io').listen(server);
 var webSocket = require('ws');
 var ws = new webSocket('ws://127.0.0.1:6437', {log: false});
 var fs = require('fs')
 var applescript = require("applescript");

 io.set('log level', 1);


 var PATH = path.resolve(__dirname, '') + "/";
 console.log(PATH)

 var raw_applications = fs.readdirSync('/Applications/')
 var categories = fs.readdirSync(PATH + 'scripts/')
 var applications = []
 var scripts = {}

 for (var i = categories.length - 1; i >= 0; i--) {
  if (categories[i] !== ".DS_Store"){
    var categoryScripts = fs.readdirSync(PATH + 'scripts/' + categories[i]);
    scripts[categories[i]] = categoryScripts;
  }
}; 

for ( var i = raw_applications.length - 1; i>=0; i--) {
  var lastFour = raw_applications[i].substr(raw_applications[i].length - 4);

  if (raw_applications[i] !== ".DS_Store" && lastFour == ".app") {
    applications.push(raw_applications[i])
  }
}

ws.onopen = function(event) {
  var enableMessage = JSON.stringify({ enableGestures: true });
  ws.send(enableMessage); 
}

// store the gestures unique names as keys within this object that relate to the gesture itself
var GesturesObject = {};
// store the gesture's unique names within an arrary for easier manipulation of things like 'length' etc.
var GesturesNames = [];

// this is the gesture object, it contains functions etc related to organising itself
var Gesture = function(name) {
  this.longGradientArray = [];
  this.shortGradientArray = [];
};

Gesture.prototype.createLongGradientArray = function() {
  var longGradientArray = [];
  for(var l = 1; l < this.rawCoords.length - 2; l++ ) {
    var prevX = this.rawCoords[l-1][0];
    var prevY = this.rawCoords[l-1][1];
    var this_gradient = (this.rawCoords[l][1]-prevY) / (this.rawCoords[l][0]-prevX);
    if (this_gradient >= 1) {
      this.longGradientArray.push(1);
    } else if (this_gradient < 1 && this_gradient > -1) {
      this.longGradientArray.push(0);
    } else if (this_gradient < -1) {
      this.longGradientArray.push(-1);
    }
  }
}

Gesture.prototype.matchLine = function(testArray){
  if (this.shortGradientArray == testArray) {
    return true;
  } else {
    return false;
  }
}

Gesture.prototype.createShortGradientArray = function() {
  var current_state = 50;
  var longGradArray = this.longGradientArray;
  for (var i = 1; i < longGradArray.length - 2; i++) {
    if ((longGradArray[i-1] == longGradArray[i]) && (longGradArray[i] == longGradArray[i+1])) {
      if (current_state != longGradArray[i]) {
        this.shortGradientArray.push(longGradArray[i])
        current_state = longGradArray[i]
      }
    }
  }
}

function runapplescript(scriptname) {
  var full_path = PATH + "scripts/" + scriptname;
  applescript.execFile(full_path, function(err, rtn){
    if (err) console.log(err)
      console.log(rtn)
  })
}

function killRecording() {
  ws.onmessage = undefined;
  ws.onmessage = function(event) {
    connectedClientSocket.emit("frame", event.data);
  }
}

function populateGesture(gesture) {
  var gesture_name = gesture.name;

  gesture.createLongGradientArray();
  gesture.createShortGradientArray();
  GesturesObject[gesture_name] = gesture;


  console.log(gesture.shortGradientArray)
  return gesture;
}

function populateGestureBetter(gesture) {

  gesture.createLongGradientArray();
  gesture.createShortGradientArray();
  return gesture;
}

function startRecording(gestureName){
  var gestureCoordsArray = [];
  var frame_counter = 0;
  ws.onmessage = function(event) {
    frame = JSON.parse(event.data);
    if ((frame.hands && frame.hands.length > 0 ) && (frame_counter % 3 == 0 && gestureCoordsArray.length < 60)){
      if (frame.hands.length != 0){
        var x = frame.hands[0].palmPosition[0];
        var y = frame.hands[0].palmPosition[1];
        gestureCoordsArray.push([x, y]);
        connectedClientSocket.emit('frame', event.data)
        connectedClientSocket.emit('gestureProgress', gestureCoordsArray.length)
      }
    } else if (gestureCoordsArray.length == 60){
        killRecording();
        var this_gesture = new Gesture(gestureName);
        this_gesture.rawCoords = gestureCoordsArray;
        GesturesNames.push(gestureName);
        populateGesture(this_gesture);
        connectedClientSocket.emit('finishedRecording', gestureName)
    }
    frame_counter++;
  }
}

var scriptFired = false;

function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}


function compareGesture(gesture) {
  for (var i = 0; i < GesturesNames.length; i++) {
    console.log(GesturesObject[GesturesNames[i]].shortGradientArray)
    console.log(gesture.shortGradientArray)
    if (arraysEqual(GesturesObject[GesturesNames[i]].shortGradientArray, gesture.shortGradientArray)&& !scriptFired) {
      runapplescript(GesturesObject[GesturesNames[i]].scriptPath)
      scriptFired = true;
    }
  }
}


function detectSegments(frame) {
  var gestureCoordsArray = [];
  var frame_counter = 0;

  ws.onmessage = function(event) {
    frame = JSON.parse(event.data);
    connectedClientSocket.emit('frame', event.data)

    if ((frame.hands && frame.hands.length > 0 ) && (frame_counter % 1 == 0 && gestureCoordsArray.length < 60)){
      if (frame.hands.length != 0){
        var x = frame.hands[0].palmPosition[0];
        var y = frame.hands[0].palmPosition[1];
        gestureCoordsArray.push([x, y]);
      }
    } else if (gestureCoordsArray.length == 60){
      var this_gesture = new Gesture();
      this_gesture.rawCoords = gestureCoordsArray;
      compareGesture(populateGestureBetter(this_gesture));
    }
    if (frame.hands.length == 0) {
      gestureCoordsArray = [];
      frame_counter = 0;
      scriptFired = false;
    }
  }
}

//initialise the client and shit



io.sockets.on('connection', function(socket){
  connectedClientSocket = socket;
  socket.emit('scripts', scripts)
  socket.emit('applications', applications)
  socket.on('startRecording', function(data){
    startRecording();
  });

  socket.on('translate', function(data){
    translate();
    console.log('starting')
  });

  socket.on('script', function(scriptName){
    runapplescript(scriptName)
  });

  ws.onmessage = function(event) {
    connectedClientSocket.emit("frame", event.data);
  }

  socket.on('detectMode', function(data) {
    detectSegments()
  })

  socket.on('scriptAttribution', function (data) {
    console.log(data)
    GesturesObject[GesturesNames[-1]].scriptPath = data['path']
      console.log('attributed!!')
      console.log(GesturesObject[GesturesNames[-1]].scriptPath)
  })
});



// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
