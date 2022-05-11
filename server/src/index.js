const express = require('express')
const bodyParser = require('body-parser')

const app = express();

var leftState = {};
var rightState = {};
var screwState ={x:0.2,y:0.2};

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

/*app.get("/Herbert.js", (req, res) => {
    res.sendFile(__dirname + "/JS/herbert.js");
});

app.get("/meth", (req, res) => {
  res.sendFile(__dirname + "/JS/meth.js");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/HTML/index.html");
});

app.get("/dummy", (req, res) => {
  	res.sendFile(__dirname + "/HTML/dummyMachine.html");
});
*/
app.post("/machine", (req, res) => {
  res.end(JSON.stringify({
    left: leftState,
    right: rightState,
    screw: screwState
  }));
});

app.get("/erwin", (req, res) => {
  res.end("test");
});

// post endpoint
app.post('/Commands/LeftHandState', bodyParser.json(), (req, res) => {
  leftState = req.body
  res.end(JSON.stringify(leftState));
});

app.post('/Commands/RightHandState', bodyParser.json(), (req, res) => {
  rightState = req.body

  if(rightState.grap){
    var dx = rightState.pos.x - screwState.x
    var dy = rightState.pos.y - screwState.y
    var len = dx*dx+dy*dy
    
    if(len < 0.01){
      screwState.x = rightState.pos.x
      screwState.y = rightState.pos.y
    }
    
  }

  res.end(JSON.stringify(req.body));
});