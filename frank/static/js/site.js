$(document).ready(function() {   
   $('#creator .button').bind('click', function() {
        $.get('/createfeed', function(data) {
          $('#creator').hide().html(data).fadeIn('slow');
        });
   });      
});
 
 