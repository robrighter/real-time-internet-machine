var sys = require('sys');
var noderouter = require('./lib/node-router');
var querystring = require('querystring');
var uuid = require('./lib/uuid');
var server = noderouter.getServer();
var url = require('url');

var validhash = '.[0-9A-Za-z_\-]*';
var buffersize = 15;



// STORAGE /////////////////////////////////////////////////////////////////////////////////////////
var workers = [
    "http://localhost:8081", //0
    "http://localhost:8082", //1
    "http://localhost:8083", //2
    "http://localhost:8084", //3
];

var feeds = {
    a03902-834938-akejhne : 0,
    b03902-834938-akejhne : 0,
    c03902-834938-akejhne : 0,
    d03902-834938-akejhne : 0,
};

var lookupWorkerURLByHash = function(hash){
    return workers[feeds[hash]];
};


// BOOTSTRAP /////////////////////////////////////////////////////////////////////////////////////
var bootstrap = function(){
    for(var key in feeds){
        addFeedToClient( lookupWorkerURLByHash(key), key);
    }  
};


// WORKER CONTROL /////////////////////////////////////////////////////////////////////////////////
var addFeedToClient = function(url, hash){
    //TODO: Call out to the client and setup the feed
};


// ROUTING  ////////////////////////////////////////////////////////////////////////////////////////
//Create a feed
server.get("createfeed", function (req, res, match) {
   //send it out to one of the workers to be created
   addFeedToClient(workers[0], uuid.getUuid()); 
});

//Dispatch long polling to the correct worker
server.get(new RegExp("^/latest/("+validhash+")$"), function (req, res, match) {
      //TODO:need to check and make sure the feed exists
      res.redirect( lookupWorkerURLByHash(match)+"/latest/"+match);
});

//Dispatch insert to the correct worker
server.post(new RegExp("^/insert/("+validhash+")$"), function(req,res,match){
    //TODO:need to check and make sure the feed exists
    res.redirect(  lookupWorkerURLByHash(match)+"/insert/"+match);
}, "form-url-encode");


// INITIALIZATION //////////////////////////////////////////////////////////////////////////////////
bootstrap();
server.listen(8080);