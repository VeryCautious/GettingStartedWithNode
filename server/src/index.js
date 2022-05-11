const express = require('express')
const bodyParser = require('body-parser')

const app = express();

var state = [];

app.listen(8080, () => {
  console.log("Application started and Listening on port 8080");
});

app.get("/Herbert.js", (req, res) => {
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

app.post("/machine", (req, res) => {
  res.end(JSON.stringify(state[state.length-1]));
});

// post endpoint
app.post('/Commands', bodyParser.json() ,(req, res) => {
  if(state.length > 100){
    state.shift();
  }
  state.push(req.body)
  res.end(JSON.stringify(state[state.length-1]));
});