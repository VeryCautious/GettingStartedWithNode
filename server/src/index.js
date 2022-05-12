const express = require('express')
const bodyParser = require('body-parser')

const app = express();

var leftState = {};
var rightState = {};
var screwState = {x:0.3,y:0.3,isGrabbed:false,size:1};
var erwinsNeedsToKnowItTurned =false
var commandQueue = [];

app.listen(8080, () => {
  console.log("Application started and Listening on port 8080");
});

const FILES = [
  ["/Herbert.js", "/JS/herbert.js"],
  ["/meth", "/JS/meth.js"],
  ["/", "/HTML/index.html"],
  ["/dummy", "/HTML/dummyMachine.html"],
  ["/images/steel", "/HTML/steel.jpg"],
  ["/images/screwhead", "/HTML/screwhead.png"],
  ["/images/crosshair_red", "/HTML/crosshair_red.png"],
  ["/images/crosshair_green", "/HTML/crosshair_green.png"]
]

FILES.forEach(route => {
  var routKey = route[0]
  var routTarget = route[1]

  app.get(routKey, (_, res) => {
    res.sendFile(__dirname + routTarget);
  });
})

app.post("/machine", (req, res) => {
  res.end(JSON.stringify({
    right: rightState,
    screw: screwState,
    toDos: [...commandQueue]
  }));
  commandQueue = []
});

app.get("/erwin", (req, res) => {
  res.end(JSON.stringify({grabbing:rightState.grap,screwing:erwinsNeedsToKnowItTurned}));
  erwinsNeedsToKnowItTurned =false
});

// post endpoint
app.post('/Commands/LeftHandState', bodyParser.json(), (req, res) => {
  leftState = req.body

  if(leftState.fingersExtended > 0){
    screwState.size = leftState.fingersExtended
    commandQueue.push(leftState.fingersExtended)
    erwinsNeedsToKnowItTurned = true
  }

  res.end(JSON.stringify(leftState));
});

app.post('/Commands/RightHandState', bodyParser.json(), (req, res) => {
  rightState = req.body

  if (rightState.grap){
    var dx = rightState.pos.x - screwState.x
    var dy = rightState.pos.y - screwState.y
    var len = dx*dx+dy*dy
    
    if (len < 0.002) {
      screwState.isGrabbed = true
    }

    if(screwState.isGrabbed){
      screwState.x = rightState.pos.x
      screwState.y = rightState.pos.y
    }
    
  }else{
    screwState.isGrabbed = false
  }

  res.end(JSON.stringify(req.body));
});