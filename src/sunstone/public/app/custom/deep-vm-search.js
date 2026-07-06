// Deep VM Search - Advanced search dropdown
(function() {
  var searchConfig = null;
  // Fetch deep search configuration from server (adjust URL as needed)
  fetch('/deep_search_config')
    .then(function(response) { return response.json(); })
    .then(function(config) {
      searchConfig = config;
      initAdvancedSearch();
    });

  function initAdvancedSearch() {
    var searchBar = document.getElementById('vm-search-bar');
    if (!searchBar) return;
    // Create dropdown
    var select = document.createElement('select');
    select.id = 'deep-search-select';
    var defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = 'All fields';
    select.appendChild(defaultOption);
    searchConfig.keys.forEach(function(keyConfig) {
      var option = document.createElement('option');
      option.value = keyConfig.key;
      option.text = keyConfig.label || keyConfig.key;
      select.appendChild(option);
    });
    // Insert before search input
    var searchInput = document.getElementById('vm-search-input');
    searchBar.insertBefore(select, searchInput);
    // Handle search on input
    function performSearch() {
      var searchTerm = searchInput.value;
      var selectedKey = select.value;
      var params = { search: searchTerm };
      if (selectedKey && searchTerm) {
        params.deep_search = JSON.stringify([{ key: selectedKey, value: searchTerm }]);
      }
      var queryString = Object.keys(params).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
      window.location.href = '/vm?' + queryString;
    }
    searchInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') performSearch();
    });
    select.addEventListener('change', function() {
      // Optionally reset input or change placeholder
    });
  }
})();
