// Sunstone tab controller for audit log
// Registration and routing
Sunstone.tabs.register_tab('audit', {
    title: 'Audit Log',
    content: 'tabs/audit/audit.html',
    onload: function() {
        // Initialization
        loadAudit({});
    }
});

// API endpoint
Sunstone.ajax_map['/audit/query'] = function(req, res) {
    var filters = JSON.parse(req.body);
    var entries = OpenNebula.Audit.query(filters);
    res.json(entries);
};
