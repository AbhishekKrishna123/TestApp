var express = require('express');
var app = express();
var port = process.env.port || 1337

const jsdom = require("jsdom");
const {JSDOM} = jsdom;
var request = require("request");
var jsonq=require("jsonq");
var jquery = require("jquery");
var bodyParser     =         require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/Giri', function(req, res) {
    res.send('Giri is god');
});

app.get('/lol', function(req, res) {
    res.send('LOL');
});

app.get('/test', function(req, res) {
    var name = req.query.name;
    res.send("Hello " + name);
});

app.post('/slash', function(req, res) {



    var highlightsURL = "https://medium.com/_/api/users/9755409acb75/profile/stream?limit=3&to=0&source=quotes&pages=1";
    var output = '' ;//= req.body.response_url + ", ";
    var response_url =  req.body.response_url;

    res.send("Processing your request...");
    res.send("One more response!");

    request(highlightsURL, function (error, response, body) {
        var newBody = "";
        // Trim out random garbage characters in the beginning of the body (non-JSON)
        for (var i=16; i<body.length; i++) {
            newBody += body[i];
        }

        // Convert to a JSON object for using jsonQ functions
        var object = jsonq(newBody);

        // Find all quoteIDs
        var quoteID = object.find('payload').find('references').find('quoteId').value();

        //console.log(numPosts + " most recent highlights by " + userName + " (@" + userHandle + ")");

        

        for (var i = 0; i < quoteID.length; i++) {
            var postID = object.find('payload').find('references').find('Quote').find(quoteID[i]).find('postId').value();
            var postName = object.find('payload').find('references').find('Post').find(postID).find('title').value();
            var postAuthorID = object.find('payload').find('references').find('Post').find(postID).find('creatorId').value();
            var postAuthor = object.find('payload').find('references').find('User').find(postAuthorID).find('name').value();
            var quoteParagraphRaw = object.find('payload').find('references').find('Quote').find(quoteID[i]).find('paragraphs').find('text').value();
            var startOffset = object.find('payload').find('references').find('Quote').find(quoteID[i]).find('startOffset').value();
            var endOffset = object.find('payload').find('references').find('Quote').find(quoteID[i]).find('endOffset').value();

            // Convert the array to a string
            var quoteParagraphString = quoteParagraphRaw.join("");
            // Get only the highlighted section
            var quote = quoteParagraphString.substring(startOffset, endOffset)

            // Get a little bit of content before and after the quote

            var paragraphStart = startOffset-60, paragraphEnd = endOffset+60;

            if (paragraphStart < 0) paragraphStart = 0;
            if (paragraphEnd > quoteParagraphString.length) paragraphEnd = quoteParagraphString.length;

            var quoteParagraph = "";
            if (paragraphStart != 0) quoteParagraph += "...";
            quoteParagraph += quoteParagraphString.substring(paragraphStart, paragraphEnd);
            if (endOffset != paragraphEnd) quoteParagraph += "..";



            highlightNumber = parseInt(i);
            highlightNumber++;
            // Output
            outputString = "\nHighlight #" + highlightNumber + ": From \"" + postName + "\" by \"" + postAuthor + "\"\n\n" + quoteParagraph + "\n";

            output += outputString;
            //console.log(outputString);
        }
        
        var responseObj = {
            "response_type" : "ephemeral",
            "text" : output
        }

        sendTest();

        function sendTest() {
            request({
                url: url,
                method: "POST",
                json: responseObj,
                headers: {
                    "content-type": "application/json",
                },
            }, function(error, response, body)
            {
            });

        }

        
    });
});

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});