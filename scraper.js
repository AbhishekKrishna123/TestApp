module.exports = {
    Scraper: function(req, res) {
        // Require this stuff
        var request = require("request");
        var jsonq=require("jsonq");
        var azure = require('azure-storage');

        var MediumName = req.query.MediumName;

        var tableSvc = azure.createTableService();

        tableSvc.retrieveEntity('MediumHighlights', 'User', MediumName, function(error, result, response){
            if(!error){
                // result contains the entity
                var userID = result.MediumUserID['_'];

                var highlightsURL = "https://medium.com/_/api/users/" + userID + "/profile/stream?limit=1&to=0&source=quotes&pages=1";

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

                    // Batch operation for inserting all highlights together
                    var batch = new azure.TableBatch();
                    var highlightsArray = [];

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

                        // Create an object and add it to array
                        var highlight = {
                            PartitionKey: {'_':'Highlight'},
                            RowKey: {'_': quoteID[i]},
                            PostName: {'_': postName[0]},
                            PostAuthor: {'_': postAuthor[0]},
                            StartOffset: {'_': startOffset[0]},
                            EndOffset: {'_': endOffset[0]},
                            Paragraph: {'_': toString(quoteParagraphString)}
                        };

                        res.send("Postname: " + highlight.PostName['_']);

                        tableSvc.insertOrReplaceEntity('MediumHighlights', highlight, function (error, result, response) {
                            if(!error){
                                // Entity inserted
                                tableSvc.retrieveEntity('MediumHighlights', 'Highlight', toString(quoteID[i]), function (error, result, response) {
                                    if (!error) {
                                        //res.send(response);
                                        // result contains the entity
                                        res.send(result.PostName['_'][0] + ", " + result.PostAuthor['_'].valueOf());
                                    } else {
                                        res.send(response);
                                    }
                                });
                            }
                            else {
                                res.send(response);
                            }
                        });

                        highlightsArray.push(highlight);
                        batch.insertOrReplaceEntity(highlightsArray[i]);
                    } // End of for loop

                    // Execute batch command
                    // tableSvc.executeBatch('MediumHighlights', batch, function (error, result, response) {
                    //     if(!error) {
                    //         // Batch completed
                    //         res.send("Successfully inserted!");
                    //     }
                    //     else {
                    //         res.send(response);
                    //     }
                    // });
                });
           }
           else {
               res.send(response);
           }
        });
    }
};