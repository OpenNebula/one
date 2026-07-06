// Sunstone Advanced VM Search
// Adds an advanced search dropdown to the VM table search bar.
// Depends on jQuery and Sunstone's existing search functionality.

(function() {
  'use strict';

  // Fetch allowed search keys from server (assuming an API endpoint /search_keys)
  var searchKeys = {};
  $.get('/search_keys', function(data) {
    searchKeys = data;
    buildAdvancedSearchUI();
  });

  function buildAdvancedSearchUI() {
    // Find existing search input container (assuming #vms_search_area or similar)
    var searchContainer = $('#vms_search_area');
    if (!searchContainer.length) return;

    // Create advanced search dropdown and input
    var advancedHtml = '<div class="advanced-search" style="display:inline-block;margin-left:10px;">' +
      '<select id="advanced_key" style="margin-right:5px;">' +
      '<option value="">-- Advanced Key --</option>';
    for (var key in searchKeys) {
      if (searchKeys.hasOwnProperty(key)) {
        advancedHtml += '<option value="' + key + '">' + key + '</option>';
      }
    }
    advancedHtml += '</select>' +
      '<input type="text" id="advanced_value" placeholder="Value" style="margin-right:5px;"/>' +
      '<button id="advanced_search_btn" class="btn btn-sm btn-primary">Search</button>' +
      '</div>';
    searchContainer.append(advancedHtml);

    // Bind search button
    $('#advanced_search_btn').click(function() {
      var key = $('#advanced_key').val();
      var value = $('#advanced_value').val();
      if (key && value) {
        // Build advanced parameter as JSON object
        var advancedParams = {};
        advancedParams[key] = value;
        // Trigger existing search function with advanced param
        // Assuming there is a global function vm_search(options) or we can trigger a custom event
        if (typeof Sunstone !== 'undefined' && Sunstone.VM && Sunstone.VM.search) {
          Sunstone.VM.search({ advanced: JSON.stringify(advancedParams) });
        } else {
          // Fallback: reload page with query parameter
          window.location.search = '?advanced=' + encodeURIComponent(JSON.stringify(advancedParams));
        }
      }
    });
  }
})();
