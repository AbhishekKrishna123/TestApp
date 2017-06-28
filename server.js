var express = require('express');
var app = express();
var port = process.env.port || 1337;

const jsdom = require("jsdom");
const {JSDOM} = jsdom;
var request = require("request");
var jsonq=require("jsonq");
var jquery = require("jquery");
var bodyParser     =         require("body-parser");

var urlencodedParser = bodyParser.urlencoded({ extended: false }); // THIS LINE WAS ADDED


var quote = '' ;
var quotesObj = [];

app.use(urlencodedParser); //bodyParser.urlencoded({ extended: false }) was removed 
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

// app.post('/test', urlencodedParser, function(req, res) {
//     // var name = req.query.name;
//     // res.send("Hello " + name);
//     res.status(200).end() // best practice to respond with empty 200 status code
//     var reqBody = req.body
//     var responseURL = reqBody.response_url
//     if (reqBody.token != 'en4O0pLksumht6WRxvw95Z93'){
//         res.status(403).end("Access forbidden")
//     }else{
//         var message = {
//             "text": "This is your first interactive message",
//             "attachments": [
//                 {
//                     "text": "Building buttons is easy right?",
//                     "fallback": "Shame... buttons aren't supported in this land",
//                     "callback_id": "button_tutorial",
//                     "color": "#3AA3E3",
//                     "attachment_type": "default",
//                     "actions": [
//                         {
//                             "name": "yes",
//                             "text": "yes",
//                             "type": "button",
//                             "value": "yes"
//                         },
//                         {
//                             "name": "no",
//                             "text": "no",
//                             "type": "button",
//                             "value": "no"
//                         },
//                         {
//                             "name": "maybe",
//                             "text": "maybe",
//                             "type": "button",
//                             "value": "maybe",
//                             "style": "danger"
//                         }
//                     ]
//                 }
//             ]
//         }
//         sendMessageToSlackResponseURL(responseURL, message)
//     }
// });

// function sendMessageToSlackResponseURL(responseURL, JSONmessage){
//     var postOptions = {
//         uri: responseURL,
//         method: 'POST',
//         headers: {
//             'Content-type': 'application/json'
//         },
//         json: JSONmessage
//     }
//     request(postOptions, (error, response, body) => {
//         if (error){
//             // handle errors as you see fit
//         }
//     })
// }

app.post('/actions', urlencodedParser, (req, res) =>{
    res.status(200).end() // best practice to respond with 200 status
    var actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string

    var index = parseInt(actionJSONPayload.actions.name[7])

    var message = {
        "response_type" : "in_channel",
        "text": "Hello",
        "replace_original": true
    }
    sendTest(actionJSONPayload.response_url, message)
})




app.post('/slash', function(req, res) {

    var reqBody = req.body
    if (reqBody.token != 'en4O0pLksumht6WRxvw95Z93')
    {
        res.status(403).end("Access forbidden")
    }

    else{


    var numPosts = req.body.text || 1;
    var highlightsURL = "https://medium.com/_/api/users/9755409acb75/profile/stream?limit=" + numPosts + "&to=0&source=quotes&pages=1";
    var output = '' ;//= req.body.response_url + ", ";
    var response_url =  req.body.response_url;
    var attachmentsObj = [];

    

    res.send(
        {
            "response_type": "ephemeral", //THIS WAS CHANGED
            "text": "Highlights are coming up..."
        }
    );

    request(highlightsURL, function (error, response, body) {
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
            quote = quoteParagraphString.substring(startOffset, endOffset) //CHANGED AT 1222

            quotesObj.push(quote); //ADDED at 1239
            // Get a little bit of content before and after the quote

            var offset = 50;
            var paragraphStart = parseInt(startOffset) - offset;
            var paragraphEnd = parseInt(endOffset) + offset;
            
            if (paragraphStart < 0) paragraphStart = 0;
            //if (paragraphEnd > quoteParagraphString.length) paragraphEnd = quoteParagraphString.length;

            var quoteParagraph = "";
            if (paragraphStart != 0) quoteParagraph += "...";
            quoteParagraph += quoteParagraphString.substring(paragraphStart, paragraphEnd);
            if (endOffset != paragraphEnd) quoteParagraph += "..";

            var startingPart = quoteParagraphString.substring(paragraphStart, startOffset);
            var endingPart = quoteParagraphString.substring(endOffset, paragraphEnd);


            highlightNumber = parseInt(i);
            highlightNumber++;
            // Output
            outputString = "\nHighlight #" + highlightNumber + ": From \"" + postName + "\" by \"" + postAuthor + "\"\n\n" + quoteParagraph + "\n";

            // Formatting
            var obj = {
                "pretext": "*Highlight #" + highlightNumber + "* from *" + postName + "* by _" + postAuthor + "_",
                "text": "`" + quote + "`",
                "callback_id" : "button-trial",
                "mrkdwn_in": [
                    "text",
                    "pretext"
                ],
                "color": "#3AA3E3",        // THIS AND THE NEXT PARAMETER WERE ADDED
                "actions": [
                {
                    "name": "Send H" + highlightNumber +" as message",
                    "text": "Send as message",
                    "type": "button",
                    "value": "Send as message"
                }
            ]

            };

            attachmentsObj.push(obj);

            output += outputString;
            //console.log(outputString);
        }
        
        var responseObj = {
            "response_type" : "in_channel", // THIS WAS CHANGED
            "text" : "Here are your highlights:",
            "attachments": attachmentsObj
        }

        sendTest(response_url, responseObj); //CHANGED

        // function sendTest(JSONmsg/*CHANGED*/) {
        //     request({
        //         url: response_url,
        //         method: "POST",
        //         json: JSONmsg, //CHANGED
        //         headers: {
        //             "content-type": "application/json",
        //         },
        //     }, function(error, response, body)
        //     {
        //     });

        // }

        // function postMsg(){
        //     request({
        //         url: response_url,
        //         method: "POST",
        //         json: {
        //             "response_type" : "in_channel"
        //         }
        //     })
        // }

        
    });
    }
});

function sendTest(responseURL, JSONmsg/*CHANGED*/) {
            request({
                url: responseURL,
                method: "POST",
                json: JSONmsg, //CHANGED
                headers: {
                    "content-type": "application/json",
                },
            }, function(error, response, body)
            {
            });

}

// app.post('/actions', urlencodedParser, function(req, res){

//     res.status(200).end()
//     var reqBody = req.body
//     if (reqBody.token != 'en4O0pLksumht6WRxvw95Z93')
//     {
//         res.status(403).end("Access forbidden")
//     }

//     else
//     {
//         var JSONpayload = JSON.parse(req.body.payload)
//         var payload = {

//             //"response_type" : "in_channel",
//             "text" : "Your message",
//             //"replace_original" : true
//         }

//         sendTest("https://hooks.slack.com/services/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", payload);

//         // function sendTest2(JSONmsg/*CHANGED*/) {
//         //     request({
//         //         url: response_url,
//         //         method: "POST",
//         //         json: JSONmsg, //CHANGED
//         //         headers: 
//         //         {
//         //             "content-type": "application/json",
//         //         },
//         //     }, function(error, response, body){}
//         //     );
//         // }
//     }


// });


var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});



app.get('/setup', function (req, res) {
    var InitialSetup = require("./InitialSetup");
    //res.send('Setup page');
    InitialSetup.Setup(req, res);
});

app.get('/entity', function (req, res) {
    var entity = require("./entity");
    entity.getEntity(req, res);
});

app.get('/scraper', function (req, res) {
    var entity = require("./scraper");
    entity.Scraper(req, res);
});