/**
 * @author Joel Oughton
 */
var Emails = (function() {
    var _Email = this;
    
    function _filter(array, callback) {
        var filtered = [];
        $.each(array, function(index, val) {
            var reduced = callback(index, val);
            if (reduced != undefined) filtered.push(reduced);
        });
        
        return filtered;
    }

    return {
        filter: function(array, callback) {
            return filter(array, callback);
        },
        filterByDate: function(emails, start, end) {
             var filter = function(index, email) {
                if (!email.Date) return;

                var eDate = new Date(email.Date);
                
                if (eDate < end && eDate >= start) 
                    return email;
            };
            
            return _filter(emails, filter);
        },
        extractName: function(email) {
            if (!email.To) return;
            
            var pattern = /[a-z]+ [a-z]+/i;
            var result = email.To.match(pattern);
            
            return result;
        }
    };
})();
