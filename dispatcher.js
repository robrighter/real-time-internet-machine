var sys = require('sys');
var fs = require('fs');
var noderouter = require('./lib/node-router');
var rest = require('./lib/restler/restler');
var querystring = require('querystring');
var uuid = require('./lib/uuid');
var server = noderouter.getServer();
var url = require('url');
var LoadBalancer = new require('./loadbalancer').LoadBalancer;
var purl = require('url');
var commons = require('./commons');
var _ = require('./lib/underscore')._;

_.templateSettings = {
  start       : '{{',
  end         : '}}',
  interpolate : /\{\{(.+?)\}\}/g
};

var validhash = '.[0-9A-Za-z_\-]*';
var loadbalancer = new LoadBalancer([
    "http://localhost:8081"
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
        addFeedToClient( lookupWorkerURLByHash(key), key, function(data){});
    }  
};


// WORKER CONTROL /////////////////////////////////////////////////////////////////////////////////
var addFeedToClient = function(url, hash, callback){
    //TODO: Call out to the client and setup the feed
    rest.post( url +"/__create", { data: { "hash" : hash }}).addListener('complete', function(data, response) {
        feeds[hash] = url;
        callback(data);
    });
};


// ROUTING  ////////////////////////////////////////////////////////////////////////////////////////
//Create a feed
server.get("/createfeed", function (req, res, match) {
   addFeedToClient(loadbalancer.getNextWorkerServer(), uuid.getUuid(), function(feedinfo){
       fs.readFile('./frank/prod-buildout/createfeed.html', function (err, filecontents) {
         if (err) throw err;
         //var template = _.template(filecontents);
         feedinfo['domain'] = 'localhost:8001';
         commons.writeToResponse(res, "text/html", filecontents);//template(feedinfo));
       });
       
   }); 
});

//Dispatch long polling to the correct worker
server.get(new RegExp("^/latest/("+validhash+")$"), function (req, res, hash) {
      if(url = lookupWorkerURLByHash(hash)){
          var thesince = parseInt(commons.getQueryParamValue(req.url, "since", "-1"));
          var thecallback = commons.getQueryParamValue(req.url, "callback", false);
          var jsonpcallback = (thecallback) ? ("&callback=" + thecallback) : "";
          res.redirect( url +"/latest/"+hash +"?since="+thesince + jsonpcallback);
      }
      else{
          return {status:'error', message:'invalid feed identifier'};
      }       
});

//proxy insert to the correct worker
server.post(new RegExp("^/insert/("+validhash+")$"), function(req,res,hash,poststring){
    if(url = lookupWorkerURLByHash(hash)){
        rest.post( url +"/insert/"+hash, { data: querystring.parse(poststring)}).addListener('complete', function(data, response) {
            commons.writeToResponse(res, "application/json", JSON.stringify(data));
        });  
    }
    else{
        commons.writeToResponse(res, "application/json", "{'status':'error', 'message':'invalid feed identifier'}");
    }
}, "form-url-encode");

//static files  ////////////////////////////////////////////////////////////////////////////////////////
server.get('/css/site.css', noderouter.staticHandler('./frank/prod-buildout/css/site.css'));
server.get('/js/site.js', noderouter.staticHandler('./frank/prod-buildout/js/site.js'));
server.get('/', noderouter.staticHandler('./frank/prod-buildout/index.html'));

// INITIALIZATION //////////////////////////////////////////////////////////////////////////////////
bootstrap();
server.listen(8001);