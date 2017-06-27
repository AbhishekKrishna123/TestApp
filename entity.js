module.exports = {
    getEntity: function(request, response) {
        var azure = require('azure-storage');


        var tableSvc = azure.createTableService();

        var query = new azure.TableQuery()
        .top(5)
        .where('PartitionKey eq ?', 'User');
        
        tableSvc.queryEntities('mytable',query, null, function(error, result, response) {
            if(!error) {
                // query was successful
                response.send("Success");
            }
            else {
                response.send("Fail");
            }
        });

        // tableSvc.retrieveEntity('TestTable', 'User', "request.query.MediumName", function(error, result, response){
            
        //     if(!error){
        //         response.send(response);
        //         // result contains the entity
        //         response.send(result.MediumUserID + ", " + result.DisplayName);
        //     }
        //     else {
        //         response.send(response);
        //     }
        // });
    }
}