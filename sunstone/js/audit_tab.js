// Sunstone audit trail tab
(function($) {
  $.fn.auditTab = function() {
    var container = this;
    container.html('<h2>Audit Trail</h2>' +
      '<div id="audit-filters">' +
        'User ID: <input type="number" id="filter-user" /> ' +
        'Action: <input type="text" id="filter-action" /> ' +
        '<button id="filter-btn">Filter</button>' +
      '</div>' +
      '<table id="audit-table" border="1">' +
        '<thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Arguments</th><th>Result</th><th>Objects</th></tr></thead>' +
        '<tbody></tbody>' +
      '</table>');

    function loadData(params) {
      $.getJSON('/audit/list', params || {}, function(data) {
        var tbody = container.find('#audit-table tbody');
        tbody.empty();
        data.forEach(function(row) {
          tbody.append('<tr>' +
            '<td>' + row.timestamp + '</td>' +
            '<td>' + row.user_id + '</td>' +
            '<td>' + row.action + '</td>' +
            '<td>' + (row.arguments ? JSON.parse(row.arguments) : '') + '</td>' +
            '<td>' + (row.result ? JSON.parse(row.result) : '') + '</td>' +
            '<td>' + (row.objects ? JSON.parse(row.objects) : '') + '</td>' +
            '</tr>');
        });
      });
    }

    container.find('#filter-btn').click(function() {
      var params = {};
      var userId = container.find('#filter-user').val();
      if (userId) params.user_id = userId;
      var action = container.find('#filter-action').val();
      if (action) params.action = action;
      loadData(params);
    });

    loadData();
  };
})(jQuery);

// Initialize when document ready
$(document).ready(function() {
  $('#audit-tab-container').auditTab();
});