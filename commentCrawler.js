
var fs = require('graceful-fs');
var file = 'log/buffer.json';


var io = require('socket.io')(80);
var URI = require('urijs');
var document = require('html-element').document;

var urlExists = require('url-exists');
var commentBuffer = [];
var imageBuffer = [];
var scriptBuffer = [];

var fileBuffer;

var bufferObject = {
    images: {},
    comments: {},
    scripts: {}
}



function ReadFromFileBuffer(_fileBuffer) {
    scriptBuffer = [];
    commentBuffer = [];
    imageBuffer = [];

    let comments = _fileBuffer.comments;
    //console.log(comments);
    for (var k in comments) {
        commentBuffer.push(k);
        //console.log(k);
    }

    let images = _fileBuffer.images;
    for (var image in images) {
        imageBuffer.push(image);
    };

    let scripts = _fileBuffer.scripts;
    for (var script in scripts) {
        scriptBuffer.push(script);
    };

    console.log(commentBuffer.length);
    console.log(scriptBuffer.length);
    console.log(imageBuffer.length);
}

io.on('connection', function (socket) {

    socket.on('imgurls', function (data) {
        console.log(data.url);
        if (urlExists(data.url, function (err, exists) {
            if (exists) {
                imageBuffer.push(data.url);
                bufferObject.images[data.url] = true;
            }

        }));

    });
});



//polyfills
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}


const sleep = function (ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};



function sendComments() {

    console.log("bufferlength: " + commentBuffer.length);
    let cleanedCommentBuffer = deleteEmptyEntries(commentBuffer);
    if (cleanedCommentBuffer.length > 0) {

        io.emit('comment', { comment: cleanedCommentBuffer[0] });
        console.log(cleanedCommentBuffer[0]);
        commentBuffer.shift();
    }

    let cleanedScriptBuffer = deleteEmptyEntries(scriptBuffer);
    if (cleanedScriptBuffer.length > 0) {

        //io.emit('script', { script: cleanedScriptBuffer[0] });
        console.log(cleanedScriptBuffer[0]);
        scriptBuffer.shift();
    }

    if (imageBuffer.length > 0) {
        //io.emit('imagefrombuffer', { url: imageBuffer[0] })
        imageBuffer.shift();
    }

}

function deleteEmptyEntries(buffer) {
    if (buffer.length > 0 && buffer[0] == "") {
        buffer.shift();
        deleteEmptyEntries(buffer);
    }
    if (buffer.length > 5000) {
        console.log("!!!!!!!!!!BUFFER OVERFLOW!!!!!!");
        buffer.pop();

    }
    return buffer;
}

//TODO: make three columns for script/image/text and scroll each of them seperately
//if buffered data is used -> buffer data and check for multiples and create cleaned buffer
//check how to keep tabs in html tett for ascii drawings


fs.readFile(file, 'utf8', function read(err, data) {
    ReadFromFileBuffer(JSON.parse(data))
});


let commentSender = setInterval(sendComments, 500);
