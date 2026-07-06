// Sunstone Audit Tab

Sunstone.add_tab({
    id: 'audit',
    title: 'Audit Log',
    content_url: '/tabs/audit_tab.html',
    setup: function() {
        // Initialize the audit list
        var auditTable = $('#audit_table');
        Sunstone.get_audit_logs({}, function(logs) {
            auditTable.find('tbody').empty();
            logs.forEach(function(log) {
                var row = '<tr><td>' + log.id + '</td><td>' + log.uid + '</td><td>' +
                    log.request + '</td><td>' + new Date(log.timestamp * 1000).toLocaleString() +
                    '</td><td>' + log.result_code + '</td></tr>';
                auditTable.find('tbody').append(row);
            });
        });
    },
    destroy: function() {}
});

// Filter function
function filter_audit() {
    var filter = {
        user: $('#filter_user').val(),
        start: $('#filter_start').val(),
        end: $('#filter_end').val(),
        request: $('#filter_request').val()
    };
    Sunstone.get_audit_logs(filter, function(logs) {
        var auditTable = $('#audit_table');
        auditTable.find('tbody').empty();
        logs.forEach(function(log) {
            var row = '<tr><td>' + log.id + '</td><td>' + log.uid + '</td><td>' +
                log.request + '</td><td>' + new Date(log.timestamp * 1000).toLocaleString() +
                '</td><td>' + log.result_code + '</td></tr>';
            auditTable.find('tbody').append(row);
        });
    });
}