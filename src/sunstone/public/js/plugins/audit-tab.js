// Sunstone plugin for audit log tab
Sunstone.add_tab({
    id: 'audit',
    title: 'Audit Log',
    panel: {
        html: '<div id="audit_table"></div>',
        setup: function() {
            // Load initial data
            loadAuditData({});
        }
    }
});

function loadAuditData(filters) {
    $.ajax({
        url: '/audit',
        method: 'GET',
        data: filters,
        success: function(data) {
            // Build table
            var html = '<table><tr><th>Timestamp</th><th>Method</th><th>User</th><th>Object</th><th>OID</th><th>Result</th></tr>';
            for (var i=0; i<data.length; i++) {
                var row = data[i];
                html += '<tr><td>' + row.timestamp + '</td><td>' + row.method + '</td><td>' + row.uid + '</td><td>' + row.object_type + '</td><td>' + row.request_oid + '</td><td>' + row.result + '</td></tr>';
            }
            html += '</table>';
            $('#audit_table').html(html);
        }
    });
}
