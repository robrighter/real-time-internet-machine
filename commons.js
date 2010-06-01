(function(){
    var url = require('url');
    var sys = require('sys');
    
    exports.getQueryParamValue = function(requesturl, paramname, valueifundefined){
        querydict = url.parse(requesturl,true);
        if(querydict.hasOwnProperty('query') && querydict.query.hasOwnProperty(paramname)){
            return querydict['query'][paramname];
        }
        else{
            return valueifundefined;
        }
    };
    
    exports.writeToResponse = function(res, contenttype, str){
        sys.puts("About to write a response of:\n" + str);
        res.sendHeader(200,{"Content-Type": contenttype});
        res.write(str);
        res.end(); 
    }
       
})();
