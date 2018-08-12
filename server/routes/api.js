const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const phantom = require('phantom');
const fs = require('fs');


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
  extended: true
}));

var Bear = require('../../app/models/bear');
var ScreenshotSchema = require('../../app/models/screenshot');

// router.use(function(req, res, next) {
//     // do logging
//     console.log('Something is happening.');
//     next(); // make sure we go to the next routes and don't stop here
// });


router.get('/', function(req, res) {
    res.json({ message: 'Hej 👋' }); 
});

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
                            if (err) 
                                throw err;
                    
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
