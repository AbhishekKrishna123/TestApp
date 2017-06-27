var express = require('express');
var app = express();
var port = process.env.port || 1337

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/Giri', function(req, res) {
    res.send('Giri is god');
});

app.get('/lol', function(req, res) {
    res.send('LOL');
});

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});