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
                        res.send("Number of entries: " + result.entries.length);

                        // Analyse and find 5 posts most relevant to the keyword

                        var relevanceScoreArray = [];
                        var highlightObjects = result.entries;

                        for (var i=0; i<highlightObjects.length; i++) {
                            var score = 1;

                            score += countOcurrences(highlightObjects[i].Paragraph, Keyword);
                            score += countOcurrences(highlightObjects[i].PostName, Keyword);
                            score += countOcurrences(highlightObjects[i].PostAuthor, Keyword);

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

                        for (var i=0; i < min(5, highlightObjects.length); i++) {
                            responseString += JSON.stringify(highlightObjects[relevanceScoreArray[i].index]);
                        }

                        res.send(responseString);

                    } else {
                        res.send(response);
                    }
                });

            } else {
                res.send(response);
            }
        });
    }
};

function countOcurrences(str, key) {
    var regExp = new RegExp(key, "gi");
    return (str.match(regExp) || []).length;
}