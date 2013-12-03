
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var Leap = require('leapjs');
var app = express();
 var server = http.createServer(app);
 var io = require('socket.io').listen(server);

var prevx=0;
var prevy=0;
var x;
var y;
var diffx=0;
var diffy=0;
var check=0;
var z=0;
var grad;
var gradArray=new Array();
var rEgradArray=new Array();

var type;
var lineType = new Array();
var rElineType = new Array();

 
 var possibles;
 var frame;
 var recording = true;
 var connectedClientSocket = null;
 var gestures = new Array();
 var matchGesture = new Array();
var webSocket = require('ws'),
    ws = new webSocket('ws://127.0.0.1:6437'),
   frame;

ws.onopen = function(event) {
    var enableMessage = JSON.stringify({enableGestures: true});
    ws.send(enableMessage); // Enable gestures
  };

   

function startRecording(){
  setTimeout(function(){
    finishRecording();
  }, 3000);

   record();

}


function finishRecording() {
  
   console.log("finishRecording");
   
   calculateGradient();
   matchGradient();
   for(var l=0; l<gradArray.length;l++){
    console.log("*"+gradArray[l]);                           
    check=0;
   }
   for(var l=0; l<lineType.length;l++){
    console.log(lineType[l]);                           
    check=0;
   }
   translate();
  // calculateGradient();
    gradArray=[];
   gestures=[];
    prevx=0;
    prevy=0;
    x;
    y;
    diffx=0;
    diffy=0;
    z=0;
    
}


function finish() {
  
  // console.log("finishRecording");
   
   calGradient();
  matGradient();

   for(var l=0; l<rEgradArray.length;l++){
    console.log("*"+rEgradArray[l]);                           
    check=0;
   }
   for(var l=0; l<rElineType.length;l++){
    console.log(rElineType[l]);                           
    check=0;
   }
    matchline();
  // calculateGradient();
    rEgradArray=[];
   rEgestures=[];
    prevx=0;
    prevy=0;
    x;
    y;
    diffx=0;
    diffy=0;
    z=0;
    console.log("SAd");
    
}

function matchline(){
  var match=1;
  console.log("matching....");
  for(var t=0; t<lineType.length; t++){
    console.log("ad");
     if(lineType[t]==rElineType[t]&&match>0){
      match=match+1;
      console.log("ad");
     }
     else{
      match=0;
      console.log("ad");
     }
  }

  if (match>1){
    console.log("matchfound!!!");
  }

}



  function calculateGradient(){
    var xcord;
    var ycord;
    var prevxcord;
    var prevycord;
    var c=0;
     
    if (c==0){
      
        prevxcord=gestures[0][0];
        prevycord=gestures[0][1];
        c++;
   }
     if (c>0){
       for(var l=1; l<gestures.length;l++){

          grad=(gestures[l][1]-prevycord)/(gestures[l][0]-prevxcord);
          //gradArray.push(grad);
          console.log(grad);
        prevxcord=gestures[l][0];
        prevycord=gestures[l][1];

        if (grad>=1){
          type=1;
          gradArray.push(type);

        }
       else if(grad<1&&grad>-1){
          type=0;
         gradArray.push(type);

      }

      else if(grad<-1){
          type=-1;
         gradArray.push(type);

      }

    }

    }

  }

  function matchGradient(){
     
     var poscount=0;
     var negcount=0;
     var neutralcount=0;
     var c1=0;
     var c2=0;
     var c3=0;
     for(var l=0; l<gradArray.length;l++){
       
      if(gradArray[l]==1){
        poscount=poscount+1;
         //console.log("sAD");
        if (poscount>1 && c1==0){

          lineType.push(1);
          console.log("1");
          c1=1;
          negcount=0;
          neutralcount=0;
           c3=0;
           c2=0;
        }
          
      }

      if(gradArray[l]==-1){
        negcount=negcount+1;
        if (negcount>1&&c2==0){
          lineType.push(-1);
          console.log("-1");
          c2=1;
          poscount=0;
        neutralcount=0;
        c3=0;
        c1=0;
        }
        

      }

      if(gradArray[l]==0){
        neutralcount=neutralcount+1;
        if (neutralcount>1&&c3==0){
          lineType.push(0);
          console.log("0");
          c3=1;
           negcount=0;
        poscount=0;
        c1=0;
        c2=0;
        }
       

      }
    
   }



  }

    

  

 

  function record(){
     ws.onmessage = function(event) {
        //var enableMessage = JSON.stringify({enableGestures: true});
    //ws.send(enableMessage); // Enable gestures
    frame = JSON.parse(event.data); 

      
      if((frame.hands && frame.hands.length > 0 )&& z%10== 0&&z<270){
       

        //console.log("*"+frame.hands[0].palmPosition[0],frame.hands[0].palmPosition[1]);
         if (check!=0){
         var x= frame.hands[0].palmPosition[0];
         var y= frame.hands[0].palmPosition[1];
         diffx=(x-prevx)+diffx;
         diffy=(y-prevy)+diffy;
         console.log(diffx,diffy);
         prevx=x;
         prevy=y;
         gestures.push([diffx,diffy]);
         z++;
         }
         else{
          check=1;
          console.log("1"+frame.hands[0].palmPosition[0],frame.hands[0].palmPosition[1]);
          var x= frame.hands[0].palmPosition[0];
         var y= frame.hands[0].palmPosition[1];
         gestures.push([0,0]);
         prevx=x;
         prevy=y;
         }
     
      }
      z++;
     };
  }
  
 function translate(){

   setTimeout(function(){
    finish();
  }, 3000);

   record();

}

function calGradient(){
    var xcord;
    var ycord;
    var prevxcord;
    var prevycord;
    var c=0;
     
    if (c==0){
      
        prevxcord=gestures[0][0];
        prevycord=gestures[0][1];
        c++;
   }
     if (c>0){
       for(var l=1; l<gestures.length;l++){

          grad=(gestures[l][1]-prevycord)/(gestures[l][0]-prevxcord);
          //gradArray.push(grad);
          console.log(grad);
        prevxcord=gestures[l][0];
        prevycord=gestures[l][1];

        if (grad>=1){
          type=1;
          rEgradArray.push(type);

        }
       else if(grad<1&&grad>-1){
          type=0;
         rEgradArray.push(type);

      }

      else if(grad<-1){
          type=-1;
         rEgradArray.push(type);

      }

    }

    }

  }

  function matGradient(){
     
     var poscount=0;
     var negcount=0;
     var neutralcount=0;
     var c1=0;
     var c2=0;
     var c3=0;
     for(var l=0; l<rEgradArray.length;l++){
       
      if(rEgradArray[l]==1){
        poscount=poscount+1;
         //console.log("sAD");
        if (poscount>1 && c1==0){

          rElineType.push(1);
          console.log("1");
          c1=1;
          negcount=0;
          neutralcount=0;
           c3=0;
           c2=0;
        }
          
      }

      if(rEgradArray[l]==-1){
        negcount=negcount+1;
        if (negcount>1&&c2==0){
          rElineType.push(-1);
          console.log("-1");
          c2=1;
          poscount=0;
        neutralcount=0;
        c3=0;
        c1=0;
        }
        

      }

      if(rEgradArray[l]==0){
        neutralcount=neutralcount+1;
        if (neutralcount>1&&c3==0){
          rElineType.push(0);
          console.log("0");
          c3=1;
           negcount=0;
        poscount=0;
        c1=0;
        c2=0;
        }
       

      }
    
   }



  }





io.sockets.on('connection', function(socket){
  connectedClientSocket = socket;
  socket.on('startRecording', function(data){
    console.log('starting')
    startRecording();
  });
  socket.on('translate', function(data){

    translate();
     console.log('starting')
  });
});




 

// all environments
app.set('port', process.env.PORT || 8072);
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
