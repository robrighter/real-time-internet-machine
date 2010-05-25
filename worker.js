var sys = require('sys');
var fs = require('fs');
var noderouter = require('./lib/node-router');
var querystring = require('querystring');
var lpb = require('./lib/longpollingbuffer');
var uuid = require('./lib/uuid');
var server = noderouter.getServer();
var url = require('url');

var validhash = '.[0-9A-Za-z_\-]*';
var buffersize = 15;
var feeds = {};

sys.puts("The uuid is: " +uuid.getUuid());

//Create a feed
server.get("__create", function (req, res, match) {
   //grab the hash from the query string 
   feeds[hash] = new lpb.LongPollingBuffer(buffersize);
   return {status : "success"} 
});

//Get updates on a feed
server.get(new RegExp("^/latest/("+validhash+")$"), function (req, res, match) {
    
    //first check to verify that the feed exists
    if(!feeds.hasOwnProperty(match)){
        return {error:'true', message:'invalid feed identifier'};
    }
    
    buffer = feeds[match];
    
    var thesince;
    if(url.parse(req.url,true).hasOwnProperty('query') && url.parse(req.url,true).query.hasOwnProperty('since')){
        thesince = parseInt(url.parse(req.url,true)['query']['since']);
    }
    else {
        thesince = -1;
    }
    sys.puts('The Since = ' +  thesince);
    buffer.addListenerForUpdateSince(thesince, function(data){
         var body = '['+data.map(JSON.stringify).join(',\n')+']';
         res.sendHeader(200,{"Content-Type": "text/html"});
         res.write( body );
         res.close();
    });  
});

//insert data into a feed
server.post(new RegExp("^/insert/("+validhash+")$"), function(req,res,match){
    
    //first check to verify that the feed exists
    if(!feeds.hasOwnProperty(match)){
        return {error:'true', message:'invalid feed identifier'};
    }
    
    ///SOMETHING WRONG HERE WITH THE DEFINISHION OF MATCH THIS NEEDS TO BE FIXED
    toinsert = cleanit(querystring.parse(match));
    
    buffer = feeds[match];
    sys.puts("ABOUT TO INSERT THE FOLLOWING RECORD:\n" + JSON.stringify(toinsert));
    buffer.push(toinsert);
}, "form-url-encode");





server.listen(8080);