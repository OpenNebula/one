# Sunstone tab for audit trail
# Register in sunstone views/tabs tab section

module OpenNebula
  class SunstoneViews
    def self.audit_tab
      {
        name: 'Audit Trail',
        view: 'audit',
        icon: 'fa-history',
        html: <<-HTML
<div id="audit_tab" class="row">
  <div class="col-md-12">
    <form id="audit_filter" class="form-inline">
      <div class="form-group">
        <label for="user_id">User ID:</label>
        <input type="text" id="user_id" class="form-control" placeholder="User ID">
      </div>
      <div class="form-group">
        <label for="start_time">Start:</label>
        <input type="datetime-local" id="start_time" class="form-control">
      </div>
      <div class="form-group">
        <label for="end_time">End:</label>
        <input type="datetime-local" id="end_time" class="form-control">
      </div>
      <div class="form-group">
        <label for="request_name">Request:</label>
        <input type="text" id="request_name" class="form-control" placeholder="e.g., one.vm.deploy">
      </div>
      <div class="form-group">
        <label for="object_id">Object ID:</label>
        <input type="text" id="object_id" class="form-control" placeholder="Object ID">
      </div>
      <button type="button" id="audit_search" class="btn btn-primary">Search</button>
    </form>
    <hr>
    <table id="audit_results" class="table table-striped">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>User ID</th>
          <th>Request</th>
          <th>Params</th>
          <th>Result</th>
          <th>Objects</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>
  </div>
</div>
<script>
$('#audit_search').click(function() {
  var filters = {
    user_id: $('#user_id').val(),
    start: $('#start_time').val(),
    end: $('#end_time').val(),
    request: $('#request_name').val(),
    object_id: $('#object_id').val()
  };
  $.ajax({
    url: '/audit/query',
    type: 'POST',
    data: JSON.stringify(filters),
    contentType: 'application/json',
    success: function(data) {
      var tbody = $('#audit_results tbody');
      tbody.empty();
      data.forEach(function(entry) {
        tbody.append('<tr><td>' + entry.timestamp + '</td><td>' + entry.user_id + '</td><td>' + entry.request + '</td><td>' + entry.params + '</td><td>' + entry.result + '</td><td>' + entry.objects + '</td></tr>');
      });
    }
  });
});
</script>
        HTML
      }
    end
  end
end
