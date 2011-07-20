var SentItems = function(dateRange, rawEmails) {
    var _periods = [], prev, cur;

    // loop through the days from start to finish
    for (var i = dateRange.start.getTime(); i > dateRange.end.getTime(); i -= 1000*60*60*24) {
        cur = new Period(
            { start: new Date(i), end: new Date(i + 1000*60*60*24) }, rawEmails);

        _periods.push(cur);
    }

    return {
        periods: function() { return $.extend(true, [], _periods); },
        recipientToEmails: function(recipient, period) {
            var pname = period.range().start.toDateString();
            var rname = recipient.name() + '-' + pname;
            var branch = { nodes: {}, edges: {} };
            var emails = recipient.emails();

            $.each(emails, function(index, email) {
                var ename = email.subject() + '-' + rname;
                
                // add the node
                branch.nodes[ename] = $.extend({ type: 'email' }, email);
                
                if (!branch.edges[rname]) branch.edges[rname] = {};
                
                // add the edge
                branch.edges[rname][ename] = {};
            });
            
            return branch;
        },
        rangeToBranch: function(range, node) {
            var branch = { nodes: {}, edges: {} }, pname, prevName, nodeObj, 
                r2e = this.recipientToEmails;
           
            // loop through the periods
            $.each(_periods, function(index, period) {
                if (period.range().start <= range.start &&
                    period.range().start > range.end) {
                    
                    pname = period.range().start.toDateString();
                    branch.nodes[pname] = $.extend({ mass: period.recipients().length, type: 'period', r2e: r2e }, period);
                    
                    // add branches when possible
                    if (prevName) {
                        if (!branch.edges[prevName]) branch.edges[prevName] = {};
                        branch.edges[prevName][pname] = {};
                    }
                    
                    // loop through the recipients
                    $.each(period.recipients(), function(name, recipient) {
                        var rname = name + '-' + pname;
                        
                        branch.nodes[rname] = $.extend({ emailsno: recipient.emails().length, type: 'recipient', r2e: r2e, period: period }, recipient);
                        
                        if (!branch.edges[pname]) branch.edges[pname] = {};
                        branch.edges[pname][rname] = {};
                    });
                }

                prevName = pname;
            });
            
            return branch;
        }
    };
};

var Period = function(dateRange, rawEmails) {
    var _recipients = {}, _emails = [], _next, _prev;
    var _range = dateRange, _raw = rawEmails;
    
    function buildRecipients(raw) {
        var names = {}, recipients = {};
        var raw = Emails.filterByDate(raw, _range.start, _range.end);
        
        $.each(raw, function(index, val) {
            var rec = Emails.extractRecipient(val);
            
            if (rec) {
                if (!names[rec.name]) {
                    names[rec.name] = 1;
                    recipients[rec.name] = new Recipient(rec.name, rec.address);
                } else {
                    names[rec.name]++;
                }
            }
        });
        
        return recipients;
    }

    function buildEmails(raw, recipients) {
        var emails = [];
        var raw = Emails.filterByDate(raw, _range.start, _range.end);
        
        $.each(raw, function(index, val) {
            if (!val.To || !val.Subject || !val.Date) return;
            if (typeof(val.To) != 'string' || typeof(val.Subject) != 'string'
                || typeof(val.Date) != 'string')
                return;

            var rec;
            var email = new Email(new Date(val.Date), val.To, val.Subject);
            emails.push(email);

            // add this email to the appropriate recipient
            rec = Emails.extractRecipient(val);
            if (rec && recipients[rec.name]) {
                recipients[rec.name].addEmail(email);

            }
        });

        return emails;
    }

    function init() {
        _recipients = buildRecipients(_raw); 
        _emails = buildEmails(_raw, _recipients);
    }

    init();

    return {
        recipients: function() { return $.extend({}, _recipients); },
        emails: function() { return $.extend(true, [], _emails); },
        next: function(next) { if (!next) return _next; else _next = next; },
        prev: function(prev) { if (!prev) return _prev; else _prev = prev; },
        range: function() { return _range; }
    };
};

var Email = function(date, to, subject) {
    return {
        date: function() { return date; },
        to: function() { return to; },
        subject: function() { return subject; }
    };
};

var Recipient = function(name, address) {
    var _emails = [];

    return {
        name: function() { return name; },
        address: function() { return address; },
        emails: function() { return $.extend(true, [], _emails); },
        addEmail: function(email) { if (email) _emails.push(email); }
    };
}

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
                    return $.extend({}, email);
            };
            
            return _filter(emails, filter);
        },
        extractRecipient: function(email) {
            if (!email.To) return;
            
            var namePattern = /[a-z]+ [a-z]+/i;
            var addrPattern = /[^<]+@[^>]+/;
            var name = email.To.match(namePattern);
            var address = email.To.match(addrPattern);

            if (!name || !address || !name[0] || !address[0]) return;

            return { 
                name: name[0],
                address: address[0]
            };
        }
    };
})();
