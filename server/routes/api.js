const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const phantom = require('phantom');
const fs = require('fs');
var socketio = require('socket.io');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
  extended: true
}));

var Bear = require('../../app/models/bear');
var ScreenshotSchema = require('../../app/models/screenshot');

router.get('/', function(req, res) {
    res.json({ message: 'Hej 👋' }); 
});

module.exports.listen = function(server){
    io = socketio.listen(server);

    io.on('connection', function(socket){
        console.log('A new WebSocket connection has been established');
    
        socket.on('create screenshot', function(data) {
            console.log("hej data", data);
            // client.emit('broad', data);
    //		client.broadcast.emit('broad',data);
               //client.broadcast.emit('broad',data);
        });
    });
};



router.route('/screenshot')
    .post(function(req, res) {
        var images = [];
        req.body.url.forEach(element => {
            var screenshot = new ScreenshotSchema();
            screenshot.url = element;
            ScreenshotSchema.find({url: screenshot.url}, (err, screenshots) => {
                if(screenshots.length === 0 ) {
                    var fileName = screenshot.url.replace(/\//g, "-");
                    var imagePath = 'screenshots/' + fileName + '.png';
                    console.log(fileName);

                    renderImage(screenshot.url, imagePath).then(() => {
                        screenshot.img.data = fs.readFileSync(imagePath);
                        screenshot.img.contentType = 'image/png';
                        screenshot.save(function (err, screenshot) {
                            if (err) {
                                throw err;
                            }
                            // io.emit('new imaged saved', imagePath);
                            console.error('saved img to mongo');
                        });
                    });
                    images.push(fileName);
                } else {
                    console.log("screenshot already created!");
                    var fileName = screenshots[0].url.replace(/\//g, "-")
                    images.push(fileName);
                }
            })
            
        });
        res.json({ message: 'Files created:' + images });
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
    
module.exports = router;
