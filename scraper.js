module.exports = {
    // Scraper function scrapes users' highlights using their API
    // PARAMETERS: MediumName
    Scraper: function(req, res) {
        // Require this stuff
        var request = require("request");
        var jsonq=require("jsonq");
        var azure = require('azure-storage');

        var MediumName = req.query.MediumName;

        // Initialize Azure Table Service
        var tableSvc = azure.createTableService();

        tableSvc.retrieveEntity('MediumUsers', 'User', MediumName, function(error, result, response) {
            if(!error) {
                // result contains the entity
                var MediumUserID = result.MediumUserID['_'];

                // The API URL from which returns JSON data of highlights
                var highlightsURL = "https://medium.com/_/api/users/" + MediumUserID + "/profile/stream?limit=10000&to=0&source=quotes&pages=1";

                request(highlightsURL, function (error, response, body) {

                    var newBody = "";
                    // Trim out random garbage characters in the beginning of the body (non-JSON)
                    for (var i=16; i<body.length; i+=1) {
                        newBody += body[i];
                    }

                    // Convert to a JSON object and bind jsonQ to it
                    var object = jsonq(newBody);

                    // Find all quoteIDs
                    var quoteID = object.find('payload').find('references').find('quoteId').value();

                    var numHighlights = quoteID.length;

                    //////////////////////////////////////////////////////////////////
                    //   Batch operations don't support more than 100 operations    //
                    //  So workaround for that scenario is to have multiple batches //
                    //////////////////////////////////////////////////////////////////

                    // Number of batch objects required
                    var numBatches = Math.ceil(numHighlights / 100);
                    // Array to store batch objects
                    var batchArr = [];
                    
                    // Create multiple batch objects (for supporting >100 highlights)
                    for (var j=0; j<numBatches; j++) {
                        var batch = new azure.TableBatch();
                        batchArr.push(batch);
                    }

                    // Array to store highlight objects
                    var highlightsArray = [];

                    // Loop for iterating through every quote/highlight
                    for (var i = 0; i < quoteID.length; i++) {
                        var batchIndex = Math.trunc(i/100);

                        // Extract values from JSON object
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
                            PartitionKey: {'_': MediumUserID},
                            RowKey: {'_': quoteID[i]},
                            PostName: {'_': postName[0]},
                            PostAuthor: {'_': postAuthor[0]},
                            StartOffset: {'_': startOffset[0]},
                            EndOffset: {'_': endOffset[0]},
                            Paragraph: {'_': toString(quoteParagraphString)},
                        };

                        // id = "";
                        // id += quoteID[i];

                        // tableSvc.insertOrReplaceEntity('MediumHighlights', highlight, function (error, result, response) {
                        //     if(!error){
                        //         // Entity inserted
                        //         tableSvc.retrieveEntity('MediumHighlights', 'Highlight', id, function (error, result, response) {
                        //             if (!error) {
                        //                 //res.send(response);
                        //                 // result contains the entity
                        //                 res.send(result.PostName['_'] + ", " + result.PostAuthor['_']);
                        //             } else {
                        //                 res.send(response);
                        //             }
                        //         });
                        //     }
                        //     else {
                        //         res.send(response);
                        //     }
                        // });

                        highlightsArray.push(highlight);
                        batchArr[batchIndex].insertOrReplaceEntity(highlightsArray[i]);
                    } // End of for loop

                    // Call the recursive function
                    batchProcess(highlightsArray, batchArr, 0, numBatches - 1);

                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    // Recursive function for inserting multiple batches
                    function batchProcess(highlightsArray, batchArr, currentBatch, totalBatch) {
                        // Execute batch command
                        tableSvc.executeBatch('MediumHighlights', batchArr[currentBatch], function (error, result, response) {
                            if(!error) {
                                // Batch completed
                                if (currentBatch >= totalBatch) {
                                    // All batches completed
                                    res.send("Successfully inserted batch with " + highlightsArray.length + "highlights");
                                } else {
                                    batchProcess(highlightsArray, batchArr, currentBatch+1, totalBatch);
                                }
                            } else {
                                res.send(response);
                            }
                        });
                    }
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
                });
           } else {
               res.send(response);
           }
        });
    }
};