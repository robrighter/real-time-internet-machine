(function(){
    var sys = require('sys');

    exports.LoadBalancer = function(workerslist){
        var workers = workerslist;
        var next;
    
        this.getNextWorkerServer = function(){
            next = workers.shift();
            workers.push(next);
            sys.inspect(workers);
            return next;
        }
    }
})();

//TEST
//var lb = new exports.LoadBalancer(['one','two','three','four','five']);
//for(var i = 0; i< 20; i++)
//  sys.puts(lb.getNextWorkerServer());
  

