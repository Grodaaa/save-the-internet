var express    = require('express');        // call express
var app        = express();                 // define our app using express
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const phantom = require('phantom');
const fs = require('fs');

var ScreenshotSchema = require('./app/models/screenshot');

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

    socket.on('join', function(data) {
        console.log(data);
    });

    socket.on('create screenshot', function(data) {
        var urls = [];
        urls = data.replace(/\s/g, "").split(',');

        urls.forEach(element => {
            socket.emit('image process status', "Creating screenshot from " + element + "...");
            var screenshot = new ScreenshotSchema();
            screenshot.url = element;
            ScreenshotSchema.find({url: screenshot.url}, (err, screenshots) => {
                if(screenshots.length === 0 ) {
                    var fileName = screenshot.url.replace(/\//g, "-");
                    var imagePath = 'screenshots/' + fileName + '.png';

                    renderImage(screenshot.url, imagePath).then(() => {
                        screenshot.img.data = fs.readFileSync(imagePath);
                        screenshot.img.contentType = 'image/png';
                        screenshot.save(function (err, screenshot) {
                            if (err) {
                                throw err;
                            }
                            console.error('saved img to mongo');
                            socket.emit('image process status', "Screenshot from " + element + " has been saved to database!");
                            socket.emit('get image', screenshot.img);

                            fs.unlink(imagePath, (err) => {
                                if (err) throw err;
                                console.log('successfully deleted ' + imagePath);
                            });
                        });
                    });
                } else {
                    socket.emit('image process status', "Screenshot already created, fetching from database...");
                    console.log("screenshot already created!");
                    socket.emit('get image', screenshots[0].img);
                }
            })
            
        });
        socket.emit('broad', 'data');
    });
});

async function renderImage(url, imagePath) {
    const instance = await phantom.create();
    const page = await instance.createPage();

    const status = await page.open(url);
    console.log(status);
    const content = await page.property('content');
    const image = await page.render(imagePath);
    await instance.exit();
}
  
http.listen(port, function() {
    console.log('Magic happens on port ' + port);
});

