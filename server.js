// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var mongoose = require('mongoose');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/code-test')
  .then(() =>  console.log('MongoDB <3 Mongoose: connection succesfull'))
  .catch((err) => console.error(err));

const api = require('./server/routes/api');

app.use('/api', api);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
