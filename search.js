module.exports = {
    // Search through the user's highlights and return the most relevant posts
    // PARAMETERS: MediumName, Keyword
    Search: function (req, res) {

        // require this stuff
        var azure = require("azure-storage");

        var MediumName = req.query.MediumName;
        var Keyword = req.query.Keyword;

        // Initialize Azure Table Service
        var tableSvc = azure.createTableService();

        tableSvc.retrieveEntity('MediumUsers', 'User', MediumName, function (error, result, response) {
            if (!error) {
                // Successful
                var MediumUserID = result.MediumUserID['_'];

                // Query to get user highlights from table
                var query = new azure.TableQuery().where('PartitionKey eq ?', MediumUserID);

                tableSvc.queryEntities('MediumHighlights', query, null, function (error, result, response) {
                    if (!error) {
                        // query was successful

                        //res.send(result.entries[0].PostName);

                        // Analyse and find 5 posts most relevant to the keyword

                        var relevanceScoreArray = [];
                        var highlightObjects = result.entries;

                        for (var i=0; i<highlightObjects.length; i++) {
                            var score = 1;

                            score += countOcurrences(highlightObjects[i].Paragraph['_'], Keyword);
                            score += countOcurrences(highlightObjects[i].PostName['_'], Keyword);
                            score += countOcurrences(highlightObjects[i].PostAuthor['_'], Keyword);

                            relevanceScoreObject = {
                                "index": i,
                                "score": score
                            }

                            relevanceScoreArray.push(relevanceScoreObject);
                        }

                        // Sorts the score array in descending order
                        relevanceScoreArray.sort(function (a, b) {
                            return parseInt(b.score) - parseInt(a.score);
                        });

                        // Return upto top 5 results
                        var responseString = "";

                        for (var i=0; i < Math.min(5, highlightObjects.length); i++) {
                            responseString += "\n<br><br><br><h1>Post: " + highlightObjects[relevanceScoreArray[i].index].PostName['_'] + 
                                                "  Author: " + highlightObjects[relevanceScoreArray[i].index].PostAuthor['_'] +
                                                "\n</h1><br><br><p>" + highlightObjects[relevanceScoreArray[i].index].Paragraph['_'];
                            //JSON.stringify(highlightObjects[relevanceScoreArray[i].index]);
                        }
                        res.set('Content-Type', 'text/html');
                        res.send(responseString + "</p>");

                    } else {
                        res.send(response);
                    }
                });

            } else {
                res.send(response);
            }
        });
        function countOcurrences(str, key) {
            var regExp = new RegExp(key, "gi");
            return (str.match(regExp) || []).length;
        }
    }
};

