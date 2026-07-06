// Sunstone Audit Log View

var AuditPanel = function(data) {
  this.html = [
    '<div class="panel">',
      '<h3>Audit Log</h3>',
      '<div class="filters">',
        '<label>User ID: <input type="text" name="user_id" /></label>',
        '<label>Resource Type: <select name="resource_type">',
          '<option value="">All</option>',
          '<option value="VM">VM</option>',
          '<option value="HOST">Host</option>',
          '<option value="IMAGE">Image</option>',
        '</select></label>',
        '<label>Resource ID: <input type="text" name="resource_id" /></label>',
        '<label>From: <input type="datetime-local" name="start_time" /></label>',
        '<label>To: <input type="datetime-local" name="end_time" /></label>',
        '<label>Action: <input type="text" name="action" /></label>',
        '<button class="search">Search</button>',
      '</div>',
      '<table id="audit-table">',
        '<thead><tr>',
          '<th>Timestamp</th><th>User</th><th>Resource</th><th>Action</th><th>Result</th>',
        '</tr></thead>',
        '<tbody></tbody>',
      '</table>',
    '</div>'
  ].join('\n');

  this.init();
};

AuditPanel.prototype.init = function() {
  var self = this;
  $('.search', this.html).click(function() {
    var filters = {};
    $('.filters input, .filters select').each(function() {
      var name = $(this).attr('name');
      var val = $(this).val();
      if (val) filters[name] = val;
    });
    $.get('/audit', filters, function(data) {
      var tbody = $('#audit-table tbody');
      tbody.empty();
      data.forEach(function(entry) {
        tbody.append('<tr><td>' + entry.timestamp + '</td><td>' + entry.user_id + '</td><td>' + entry.resource_type + ' ' + entry.resource_id + '</td><td>' + entry.action + '</td><td>' + (entry.result ? 'Success' : 'Failure') + '</td></tr>');
      });
    });
  });
};

// Register panel
Sunstone.addPanel('Audit', AuditPanel);