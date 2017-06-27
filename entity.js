module.exports = {
    getEntity: function(request, response) {
        var azure = require('azure-storage');


        var tableSvc = azure.createTableService();

        tableSvc.retrieveEntity('TestTable', 'User', request.query.MediumName, function(error, result, response){
            if(!error){
                // result contains the entity
                response.send(result.MediumUserID + ", " + result.DisplayName);
            }
            else {
                response.send(response);
            }
        });
    }
}