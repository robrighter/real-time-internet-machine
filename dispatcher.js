var sys = require('sys');
var noderouter = require('./lib/node-router');
var querystring = require('querystring');
var uuid = require('./lib/uuid');
var server = noderouter.getServer();
var url = require('url');
var LoadBalancer = new require('./loadbalancer').LoadBalancer;

var validhash = '.[0-9A-Za-z_\-]*';
var loadbalancer = new LoadBalancer([
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:8083",
    "http://localhost:8084",
]);


// STORAGE /////////////////////////////////////////////////////////////////////////////////////////
var feeds = {
    "a03902-834938-akejhne" : "http://localhost:8081",
    "b03902-834938-akejhne" : "http://localhost:8081",
    "c03902-834938-akejhne" : "http://localhost:8081",
    "d03902-834938-akejhne" : "http://localhost:8081",
};

var lookupWorkerURLByHash = function(hash){
    if(feeds.hasOwnProperty(hash)){
        return feeds[hash];
    }
    else{
        return "";
    }
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
    return {'status':'success', 'feed':hash}
};


// ROUTING  ////////////////////////////////////////////////////////////////////////////////////////
//Create a feed
server.get("/createfeed", function (req, res, match) {
   return addFeedToClient(loadbalancer.getNextWorkerServer(), uuid.getUuid()); 
});

//Dispatch long polling to the correct worker
server.get(new RegExp("^/latest/("+validhash+")$"), function (req, res, hash) {
      if(url = lookupWorkerURLByHash(hash))
          res.redirect( url +"/latest/"+hash);
      else
          return {status:'error', message:'invalid feed identifier'};
});

//Dispatch insert to the correct worker
server.post(new RegExp("^/insert/("+validhash+")$"), function(req,res,hash){
    if(url = lookupWorkerURLByHash(hash)){
        res.redirect(  url +"/insert/"+hash);
        res.end();
    }
    else{
        res.sendHeader(200,{"Content-Type": "application/json"});
        res.write("{'status':'error', 'message':'invalid feed identifier'}");
        res.end();
    }
}, "form-url-encode");


// INITIALIZATION //////////////////////////////////////////////////////////////////////////////////
bootstrap();
server.listen(8080);