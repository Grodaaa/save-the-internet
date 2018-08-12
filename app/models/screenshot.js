var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ScreenshotSchema   = new Schema({
    img: { data: Buffer, contentType: String },
    url: String
});

module.exports = mongoose.model('ScreenshotSchema', ScreenshotSchema);