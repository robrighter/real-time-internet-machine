var sys = require('sys');
var noderouter = require('./lib/node-router');
var querystring = require('querystring');
var lpb = require('./lib/longpollingbuffer');
var uuid = require('./lib/uuid');
var server = noderouter.getServer();
var url = require('url');

var validhash = '.[0-9A-Za-z_\-]*';
var buffersize = 40;
var feeds = {};


//Create a feed
server.post("/__create", function (req, res, poststring) {
   res.sendHeader(200,{"Content-Type": "application/json"});
   //grab the hash from the query string
   postvals = querystring.parse(poststring);
   if(postvals.hasOwnProperty('hash')){
       feeds[postvals.hash] = new lpb.LongPollingBuffer(buffersize);
       res.write('{"status" : "success", "feed" : "'+postvals.hash+'" }' );
   }
   else {
       res.write("{'status':'error', 'message':'must provide a hash for the feed to be created'}" );
   } 
   res.end(); 
}, "form-url-encode");


//insert data into a feed
server.post(new RegExp("^/insert/("+validhash+")$"), function(req,res,hash,poststring){
    
    sys.puts("hash = " + hash);
    sys.puts("postJSON = " + sys.inspect(querystring.parse(poststring)));
    
    res.sendHeader(200,{"Content-Type": "application/json"});
    //if the feed exists go ahead and insert the item into the buffer
    if(feeds.hasOwnProperty(hash)){
         toinsert = cleaninsert(querystring.parse(poststring));
         buffer = feeds[hash].push(toinsert);
         res.write("{'status':'success', 'inserted': "+JSON.stringify(toinsert)+"}");   
    }
    else{
        res.write("{'status':'error', 'message':'invalid feed identifier'}");
    }
    res.end();
    
}, "form-url-encode");


//Get updates on a feed
server.get(new RegExp("^/latest/("+validhash+")$"), function (req, res, hash) {
    
    //first check to verify that the feed exists
    if(!feeds.hasOwnProperty(hash)){
        return {status:'error', message:'invalid feed identifier'};
    }
    
    buffer = feeds[hash];
    
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


var cleaninsert = function(toinsert){
    //this is where we trim down the item to be within the terms of use
    return toinsert;
}

server.listen(8081);