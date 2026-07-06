// Audit Log tab for Sunstone

(function($, OpenNebula) {
    OpenNebula.add_tab({
        id: 'audit',
        title: 'Audit Log',
        html: '<div id="audit-content"></div>',
        init: function() {
            var self = this;
            $.get('/audit', function(data) {
                var rows = JSON.parse(data);
                var html = '<table class="datatable"><thead><tr><th>ID</th><th>User</th><th>Action</th><th>Timestamp</th><th>Objects</th></tr></thead><tbody>';
                rows.forEach(function(row) {
                    html += '<tr><td>' + row.id + '</td><td>' + row.user_id + '</td><td>' + row.action + '</td><td>' + new Date(row.timestamp * 1000).toLocaleString() + '</td><td>' + row.objects + '</td></tr>';
                });
                html += '</tbody></table>';
                $('#audit-content').html(html);
            });
        },
        filters: {
            user: {
                type: 'input',
                placeholder: 'User ID'
            },
            from: {
                type: 'input',
                placeholder: 'From (epoch)'
            },
            to: {
                type: 'input',
                placeholder: 'To (epoch)'
            }
        },
        on_filter: function(params) {
            var self = this;
            $.get('/audit', params, function(data) {
                var rows = JSON.parse(data);
                var html = '<table class="datatable"><thead><tr><th>ID</th><th>User</th><th>Action</th><th>Timestamp</th><th>Objects</th></tr></thead><tbody>';
                rows.forEach(function(row) {
                    html += '<tr><td>' + row.id + '</td><td>' + row.user_id + '</td><td>' + row.action + '</td><td>' + new Date(row.timestamp * 1000).toLocaleString() + '</td><td>' + row.objects + '</td></tr>';
                });
                html += '</tbody></table>';
                $('#audit-content').html(html);
            });
        }
    });
})(jQuery, OpenNebula);
