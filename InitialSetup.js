// Initial Setup of tables when user sets up the app

// PARAMETERS: MediumName

module.exports = {
    Setup: function (req, res) {

        const jsdom = require("jsdom");
        const {JSDOM} = jsdom;
        var jquery = require("jquery");
        var azure = require('azure-storage');

        console.log('Running InitialSetup.');

        if (req.query.MediumName) {
            MediumName = req.query.MediumName;
            profileURL = "https://medium.com/@" + MediumName;

            console.log(profileURL);

            JSDOM.fromURL(profileURL).then(dom => {
                console.log("DOM created!");
                var document = dom.window.document;
                var element = document.getElementsByClassName("followState");
                var MediumUserID = element[0].getAttribute("data-user-id");
                var elem = document.getElementsByClassName("hero-title");
                var DisplayName = elem[0].innerHTML;
                // var $ = jquery(window);
                // var MediumUserID = $('.followState').attr('data-user-id');
                // var DisplayName = $('.hero-title').html();;
                console.log(MediumUserID);
                console.log(DisplayName);

                ////////////////////////////////////////////////
                // Save the details to the User Table in Azure //
                ////////////////////////////////////////////////
                var tableSvc = azure.createTableService();
                //res.send("Table service created.");
                // Create table if it doesn't exist
                tableSvc.createTableIfNotExists('TestTable', function(error, result, response){
                    if(!error){
                        //res.send("Table created.");
                        // Create an entity
                        var newUser = {
                            PartitionKey: {'_':'User'},
                            RowKey: {'_': MediumName},
                            MediumUserID: {'_': MediumUserID},
                            DisplayName: {'_': DisplayName}
                        };
                        // Insert into table
                        tableSvc.insertEntity('MediumHighlights', newUser, function (error, result, response) {
                          if(!error){
                            // Entity inserted
                            //res.send("Successfully inserted");

                            tableSvc.retrieveEntity('TestTable', 'User', MediumName, function(error, result, response){
                                if(!error){
                                    //res.send(response);
                                    // result contains the entity
                                    response.send(result.MediumUserID + ", " + result.DisplayName);
                                }
                                else {
                                    res.send(response);
                                }
                            });
                          }
                          else {
                            tableSvc.retrieveEntity('TestTable', 'User', MediumName, function(error, result, response){
                                if(!error){
                                    res.send(response);
                                    // result contains the entity
                                    response.send(result.MediumUserID + ", " + result.DisplayName);
                                }
                                else {
                                    res.send(response);
                                }
                            });

                              //res.send(response);
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