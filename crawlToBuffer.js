
var fs = require('graceful-fs');
var file = 'log/buffer.json';


var io = require('socket.io')(80);
var URI = require('urijs');
var document = require('html-element').document;

var urlExists = require('url-exists');
var commentBuffer = [];
var imageBuffer = [];
var scriptBuffer = [];

var isReady = false;

var fileBuffer;

var bufferObject = {
    images: {},
    comments: {},
    scripts: {}
}


function overWriteOldBuffer() {
    fs.writeFile(file, ' ');
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
    if (_fileBuffer != null)
        bufferObject = _fileBuffer;
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

function stripCommentDelimiters(element, index, array, rawComments) {
    var el = element.replace(/<!--|-->/g, "");
    //console.log(el);
    rawComments.push(el);

}


function findHTMLElements(element, url) {
    var comment = element.trim();
    //check if it starts as tag
    if (comment.startsWith('<')) {
        //check for no-script and no-comment
        if (!comment.startsWith('<script') && !comment.startsWith('<!')) {

            var startIndex = comment.indexOf('<img');
            //check if img inside the comment
            if (startIndex > -1) {
                var relPaths = [];
                replaceRelativePaths(comment, url, startIndex, relPaths);

                if (relPaths != null) {

                    comment = relPaths;
                    console.log(comment)
                }

                //imageBuffer.push(comment);
                comment.forEach(function (path) {
                    io.emit('image', { image: path });
                    console.log("SENDING IMAGE TO CLIENT");
                });




            }
            else {
                //io.emit('comment', { comment: comment });
                scriptBuffer.push(comment);
                //bufferObject.scripts.push(comment);
                bufferObject.scripts[comment] = true;
            }

        }

    }
    else {
        if (comment.startsWith('//') || comment.startsWith('/*')) {
            scriptBuffer.push(comment);

            bufferObject.scripts[comment] = true;
            //bufferObject.scripts.push(comment);
        }
        else {
            commentBuffer.push(comment);

            bufferObject.comments[comment] = true;
            //bufferObject.comments.push(comment);
        }
    }
}

function checkUrlExists(host, cb) {
    http.request({ method: 'HEAD', host, port: 80, path: '/' }, (r) => {
        cb(null, r.statusCode > 200 && r.statusCode < 400);
    }).on('error', cb).end();
}

function replaceRelativePaths(comment, url, startIndex, paths) {
    console.log("url:    " + url);
    var starin = startIndex || 0;
    var srcIndex = comment.substr(startIndex).indexOf('src=');
    if (srcIndex < 0) {
        srcIndex = comment.substr(startIndex).indexOf('src =');
    }
    var newSource = "";
    if (srcIndex >= starin) {
        var srcStr = comment.substr(srcIndex + 3).trim();

        //srcStr = srcStr.substr(1).trim();
        srcStr = srcStr.split(/=(.+)/)[1];
        srcStr = srcStr.split('>')[0] + ">";

        console.log("source string:      " + srcStr);
        if (srcStr.startsWith("\"http") || srcStr.startsWith("\"www")) {
            //console.log("something wrong here");
            return null;
        }
        else {
            srcStr = url + srcStr.substr(1);

            newSource = comment.substr(0, srcIndex) + 'src="' + srcStr;
            //comment = newSource;
            paths.push(newSource);
            console.log("relative path replaced to " + newSource);
            starin = srcIndex;
            replaceRelativePaths(comment, url, starin, paths);


        }

    }
}


function replaceContent(info) {
    //console.log(info.url);
    //console.log("function gets called");

    //var sourceCode = info.content.getElementsByTagName('html')[0].innerHTML;
    //console.log(sourceCode);

    var commentArray = info.content.match(/(?=<!--)([\s\S]*?)-->/g);
    var scriptCommentArray = info.content.match(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*|<!--[\s\S]*?-->$/);
    var rawComments = [];
    if (commentArray != null) {
        commentArray.forEach(function (element, index, array) { stripCommentDelimiters(element, index, array, rawComments) });

        /*rawComments.forEach(
            function (element, index, array) {
                findHTMLElements(element, index, array, info.url);
            });*/

        var interval = 2 * 1000; // 10 seconds;

        for (var i = 0; i <= rawComments.length - 1; i++) {
            setTimeout(function (i) {
                findHTMLElements(rawComments[i], info.url);
            }, interval * i, i);
        }


    }
    if (scriptCommentArray != null) {
        scriptCommentArray.forEach((comment) => {
            if (comment != null)
                findHTMLElements(comment, info.url);


        });
    }


    //console.log(rawComments);
    //document.getElementsByTagName('html')[0].innerHTML = newHTML;
    //console.log(newHTML);

}


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

    if (isReady)
        fs.writeFile(file, JSON.stringify(bufferObject));


    console.log("bufferlength: " + commentBuffer.length);
    /*
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

    */





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
    isReady = true;
});

var Crawler = require("js-crawler");

new Crawler().configure({
    depth: 6, ignoreRelative: true,
    shouldCrawl: function (url) {

        var isReddit = url.indexOf("reddit.com") >= 0;
        var isFB = url.indexOf("facebook.com") >= 0;
        var isWiki = url.indexOf("wikipedia.org") >= 0;
        var isGoogle = url.indexOf("google.com") >= 0;
        if (isReddit || isFB || isWiki || isGoogle)
            return false;
        else
            return true;
    }
})
    .crawl("http://brutalistwebsites.com/", function (content, url) { replaceContent(content, url) });

let commentSender = setInterval(sendComments, 1500);
