// Initial Setup of tables when user sets up the app

// PARAMETERS: MediumName

module.exports = {
    Setup: function (req, res) {

        const jsdom = require("jsdom");
        const {JSDOM} = jsdom;
        var azure = require('azure-storage');

        if (req.query.MediumName) {
            var MediumName = req.query.MediumName;
            var profileURL = "https://medium.com/@" + MediumName;

            JSDOM.fromURL(profileURL).then(function (dom) {
                // Extract the required things from the DOM
                var document = dom.window.document;
                var element = document.getElementsByClassName("followState");
                var MediumUserID = element[0].getAttribute("data-user-id");
                var elem = document.getElementsByClassName("hero-title");
                var DisplayName = elem[0].innerHTML;

                ////////////////////////////////////////////////
                // Save the details to the User Table in Azure //
                ////////////////////////////////////////////////
                var tableSvc = azure.createTableService();

                var newUser = {
                    PartitionKey: {'_': 'User'},
                    RowKey: {'_': MediumName},
                    MediumUserID: {'_': MediumUserID},
                    DisplayName: {'_': DisplayName}
                };

                // Insert into table
                tableSvc.insertOrReplaceEntity('MediumUsers', newUser, function (error, result, response) {
                    if (!error) {
                        // Entity inserted
                        res.send("Successfully inserted " + MediumName + "!, User ID: " + MediumUserID);
                    } else {
                        res.send(response);
                    }
                });
            });
        } else {
            res.send("Function requires 'MediumName' as a parameter!");
        }
    }
};