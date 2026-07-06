// Backend model for audit (Sunstone server side)
// This would call the oned XML-RPC or local DB
var OpenNebula = require('opennebula');

OpenNebula.Audit = {
    query: function(filters) {
        // Call oned's internal audit query
        var client = new XMLRPCClient('http://localhost:2633/RPC2');
        var result = client.call('one.audit.query', filters);
        if (result[0]) {
            return result[1];
        } else {
            throw new Error(result[1]);
        }
    }
};
