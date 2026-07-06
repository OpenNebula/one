// Extend VM list search with advanced deep search dropdown

(function() {
  'use strict';

  var VmsTab = Sunstone.tabs.VmsTab;
  var originalSearch = VmsTab.search;

  // Configuration: fetch from server or hardcoded fallback
  var deepSearchKeys = [];

  // Load keys from server configuration
  function loadDeepSearchKeys() {
    $.ajax({
      url: '/sunstone/config',
      method: 'GET',
      success: function(config) {
        if (config.vm_deep_search && config.vm_deep_search.keys) {
          deepSearchKeys = Object.keys(config.vm_deep_search.keys);
        }
        initAdvancedSearch();
      },
      error: function() {
        // Fallback
        deepSearchKeys = ['NAME', 'TEMPLATE.DESCRIPTION'];
        initAdvancedSearch();
      }
    });
  }

  function initAdvancedSearch() {
    // Add dropdown to search bar
    var searchBar = $('#vms-tab .search-bar');
    var advancedHtml = '<select id="advanced-search-key" class="form-control" style="width:auto;display:inline-block;margin-right:5px;">' +
                        '<option value="">All fields</option>';
    deepSearchKeys.forEach(function(key) {
      advancedHtml += '<option value="' + key + '">' + key + '</option>';
    });
    advancedHtml += '</select>';
    searchBar.prepend(advancedHtml);

    // Override search function
    VmsTab.search = function(query) {
      var key = $('#advanced-search-key').val();
      if (key && query) {
        // Deep search
        $.ajax({
          url: '/vm/deep_search',
          method: 'POST',
          data: JSON.stringify({ filters: { [key]: query } }),
          contentType: 'application/json',
          success: function(data) {
            VmsTab.resetData(data);
          },
          error: function() {
            // Fallback to original search
            originalSearch.call(VmsTab, query);
          }
        });
      } else {
        originalSearch.call(VmsTab, query);
      }
    };
  }

  // Initialize on tab load
  $(document).ready(function() {
    loadDeepSearchKeys();
  });

})();
