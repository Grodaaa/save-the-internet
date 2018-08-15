var express = require('express');
var app  = express();  
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
  .catch((err) => console.error(err))

app.get('/', function(req, res) {
    res.sendfile('./app/src/index.html');
});

//Setting upp websocket connections
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

                if(screenshots.length === 0 ) { // If no screenshots were found with given url -> create a new and save in db
                    var fileName = screenshot.url.replace(/\//g, "-");
                    var imagePath = 'screenshots/' + fileName + '.png';

                    renderImage(screenshot.url, imagePath).then(() => {
                        screenshot.img.data = fs.readFileSync(imagePath);
                        screenshot.img.contentType = 'image/png';
                        screenshot.save(function (err, screenshot) {
                            if (err) {
                                throw err;
                            }
                            socket.emit('image process status', "Screenshot from " + element + " has been saved to database!");
                            socket.emit('send image', screenshot.img);

                            fs.unlink(imagePath, (err) => { // Remove file on disk after saving to db
                                if (err) throw err;
                                console.log('successfully deleted ' + imagePath);
                            });
                        });
                    });
                } else { // If a screenshot was found -> return to client
                    socket.emit('image process status', "Screenshot already created, fetching from database...");
                    socket.emit('send image', screenshots[0].img);
                }
            });
        });
    });
});

async function renderImage(url, imagePath) { // render image using PhantomJS
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

