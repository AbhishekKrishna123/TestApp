// Initial Setup of tables when user sets up the app

// PARAMETERS: MediumName

module.exports = {
    Setup: function (req, res) {

        const jsdom = require("jsdom");
        const {JSDOM} = jsdom;
        var jquery = require("jquery");
        var azure = require('azure-storage');

        if (req.query.MediumName) {
            MediumName = req.query.MediumName;
            profileURL = "https://medium.com/@" + MediumName;

            JSDOM.fromURL(profileURL).then(dom => {
                console.log("DOM created!");
                var document = dom.window.document;
                var element = document.getElementsByClassName("followState");
                var MediumUserID = element[0].getAttribute("data-user-id");
                var elem = document.getElementsByClassName("hero-title");
                var DisplayName = elem[0].innerHTML;

                ////////////////////////////////////////////////
                // Save the details to the User Table in Azure //
                ////////////////////////////////////////////////
                var tableSvc = azure.createTableService();
                // Create table if it doesn't exist
                tableSvc.createTableIfNotExists('MediumUsers', function(error, result, response){
                    if(!error){
                        // Create an entity
                        var newUser = {
                            PartitionKey: {'_':'User'},
                            RowKey: {'_': MediumName},
                            MediumUserID: {'_': MediumUserID},
                            DisplayName: {'_': DisplayName}
                        };
                        // Insert into table
                        tableSvc.insertOrReplaceEntity('MediumUsers', newUser, function (error, result, response) {
                            if(!error){
                                // Entity inserted
                                res.send("Successfully inserted " + MediumName + "!, User ID: " + MediumUserID);
                            }
                            else {
                                res.send(response);
                            }
                        });
                    }
                    else {
                        res.send(response);
                    }
                });
            });   
        }
    }
};