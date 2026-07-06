// Update the loadVMs function to support advanced filter
function loadVMs(params) {
  var url = '/vm/pool_info';
  if (params) {
    url += '?' + $.param(params);
  }
  $.get(url, function(data) {
    // Existing rendering logic...
    renderVMTable(data);
  });
}

// Also modify the original search function to use new params structure
// This is a placeholder; in real implementation, merge with existing code.