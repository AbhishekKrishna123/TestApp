module.exports = {
    // Search through the user's highlights and return the most relevant posts
    // PARAMETERS: MediumName, Search Term
    Search: function (req, res) {

        // require this stuff
        var azure = require("azure-storage");

        var MediumName = req.query.MediumName;

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