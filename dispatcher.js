var sys = require('sys');
var noderouter = require('./lib/node-router');
var querystring = require('querystring');
var uuid = require('./lib/uuid');
var server = noderouter.getServer();
var url = require('url');
var LoadBalancer = new require('loadbalancer').LoadBalancer;

var validhash = '.[0-9A-Za-z_\-]*';
var loadbalancer = new LoadBalancer([
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:8083",
    "http://localhost:8084",
]);


// STORAGE /////////////////////////////////////////////////////////////////////////////////////////
var feeds = {
    a03902-834938-akejhne : "http://localhost:8081",
    b03902-834938-akejhne : "http://localhost:8081",
    c03902-834938-akejhne : "http://localhost:8081",
    d03902-834938-akejhne : "http://localhost:8081",
};

var lookupWorkerURLByHash = function(hash){
    return feeds[hash];
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
    feeds[hash] = url;
};


// ROUTING  ////////////////////////////////////////////////////////////////////////////////////////
//Create a feed
server.get("createfeed", function (req, res, match) {
   addFeedToClient(loadbalancer.getNextWorkerServer(), uuid.getUuid()); 
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