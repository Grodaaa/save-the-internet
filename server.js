var express    = require('express');        // call express
var app        = express();                 // define our app using express
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/code-test')
  .then(() =>  console.log('MongoDB 💙 Mongoose: connection succesfull'))
  .catch((err) => console.error(err));

const api = require('./server/routes/api');

app.use('/api', api);

app.get('/', function(req, res) {
    res.sendfile('./app/src/index.html');
});

io.on('connection', function(socket){
    console.log('A new WebSocket connection has been established');
});

setInterval(function() {
    var stockprice = Math.floor(Math.random() * 1000);
    io.emit('stock price update', stockprice);
  }, 50);
  
http.listen(port, function() {
    console.log('Magic happens on port ' + port);
});

