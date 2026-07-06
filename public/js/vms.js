function performSearch() {
  var searchText = document.getElementById('search-input').value;
  var advancedKey = document.getElementById('advanced-search-select').value;
  var searchParam = { search: searchText };
  if (advancedKey) {
    searchParam.advanced = {};
    searchParam.advanced[advancedKey] = searchText;
    // Clear general search text to avoid double matching
    searchParam.search = '';
  }
  // Assuming we have a function to reload table with params
  reloadVMTable(searchParam);
}

function reloadVMTable(params) {
  // Implementation depends on existing table management.
  // For example, using DataTables ajax.reload with additional data.
  // Here we mock:
  console.log('Reloading with params:', params);
  // Actually call the server-side endpoint with these params
  // Example: $.getJSON('/vm/list', params, function(data) { ... });
}