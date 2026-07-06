// Sunstone audit log tab
AuditTab = (function() {
  var tabId = 'audit_tab';
  var tableId = 'audit_table';
  var filterForm = 'audit_filter';

  function init() {
    // Create tab content
    var html = '<div class="row">' +
      '<div class="large-12 columns">' +
      '<h2>Audit Log</h2>' +
      '</div></div>' +
      '<div class="row">' +
      '<div class="large-12 columns">' +
      '<form id="audit_filter">' +
      '<label>User ID: <input type="text" name="user_id" /></label>' +
      '<label>From (timestamp): <input type="text" name="from" /></label>' +
      '<label>To (timestamp): <input type="text" name="to" /></label>' +
      '<label>Object Type: <input type="text" name="object_type" /></label>' +
      '<input type="button" value="Filter" onclick="AuditTab.applyFilter()" />' +
      '</form>' +
      '</div></div>' +
      '<div class="row">' +
      '<div class="large-12 columns">' +
      '<table id="audit_table">' +
      '<thead><tr><th>ID</th><th>User</th><th>Timestamp</th><th>Request</th><th>Result</th><th>Objects</th></tr></thead>' +
      '<tbody></tbody>' +
      '</table>' +
      '</div></div>';

    // Add tab to Sunstone menu (assuming Sunstone is loaded)
    if (typeof Sunstone !== 'undefined') {
      Sunstone.addTab(tabId, 'Audit Log', html);
    }
  }

  function applyFilter() {
    var form = document.getElementById(filterForm);
    var params = {
      user_id: form.user_id.value,
      from_time: form.from.value,
      to_time: form.to.value,
      object_type: form.object_type.value
    };
    // Send AJAX request to the backend
    jQuery.ajax({
      url: '/audit_log',
      data: params,
      dataType: 'json',
      success: function(data) {
        populateTable(data);
      }
    });
  }

  function populateTable(rows) {
    var tbody = document.querySelector('#' + tableId + ' tbody');
    tbody.innerHTML = '';
    rows.forEach(function(row) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + row.id + '</td>' +
        '<td>' + row.user_id + '</td>' +
        '<td>' + new Date(row.timestamp * 1000).toLocaleString() + '</td>' +
        '<td>' + row.request + '</td>' +
        '<td>' + row.result + '</td>' +
        '<td>' + row.objects + '</td>';
      tbody.appendChild(tr);
    });
  }

  return {
    init: init,
    applyFilter: applyFilter
  };
})();

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AuditTab.init);
} else {
  AuditTab.init();
}