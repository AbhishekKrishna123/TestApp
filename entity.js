module.exports = {
    getEntity: function(req, res) {
        var azure = require("azure-storage");

        var tableSvc = azure.createTableService();

        // var query = new azure.TableQuery()
        // .top(5)
        // .where('PartitionKey eq ?', 'User');

        // tableSvc.queryEntities('TestTable', query, null, function(error, result, response) {
        //     response.send("abcd");
        //     if(!error) {
        //         // query was successful
        //         response.send("Success");
        //     }
        //     else {
        //         response.send("Fail");
        //     }
        // });

        tableSvc.retrieveEntity('TestTable', 'User', "request.query.MediumName", function (error, result, response){
            if(!error){
                res.send(response);
                // result contains the entity
                //response.send(result.MediumUserID + ", " + result.DisplayName);
            }
            else {
                res.send(response);
            }
        });
    }
}