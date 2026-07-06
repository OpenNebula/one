// Extended search for VM table
(function() {
  // Configuration loaded from server; format: [{key: "TEMPLATE/CPU", regex: "^[0-9]+$"}, ...]
  var searchableAttributes = [];

  // Load from global or fetch
  if (typeof(search_config) !== 'undefined') {
    searchableAttributes = search_config;
  }

  function buildAdvancedSearchUI() {
    var searchBar = document.querySelector('.search-bar');
    if (!searchBar) return;

    var advancedSelect = document.createElement('select');
    advancedSelect.id = 'advanced-search-select';
    advancedSelect.innerHTML = '<option value="">All attributes</option>';
    searchableAttributes.forEach(function(attr) {
      var opt = document.createElement('option');
      opt.value = attr.key;
      opt.textContent = attr.key;
      advancedSelect.appendChild(opt);
    });

    var advancedInput = document.createElement('input');
    advancedInput.type = 'text';
    advancedInput.id = 'advanced-search-input';
    advancedInput.placeholder = 'Search value...';

    var advancedButton = document.createElement('button');
    advancedButton.textContent = 'Advanced Search';
    advancedButton.onclick = function() {
      var selectedKey = advancedSelect.value;
      var value = advancedInput.value.trim();
      if (!selectedKey || !value) return;
      var regex = null;
      var attrConfig = searchableAttributes.find(function(a) { return a.key === selectedKey; });
      if (attrConfig && attrConfig.regex) {
        regex = attrConfig.regex;
      }
      // Trigger search with custom query parameters, e.g., ?adv_key=TEMPLATE/CPU&adv_value=4&adv_regex=^[0-9]+$
      var params = new URLSearchParams(window.location.search);
      params.set('adv_key', selectedKey);
      params.set('adv_value', value);
      if (regex) params.set('adv_regex', regex);
      window.location.search = params.toString();
    };

    // Insert into search bar
    var container = document.createElement('div');
    container.id = 'advanced-search-container';
    container.appendChild(advancedSelect);
    container.appendChild(advancedInput);
    container.appendChild(advancedButton);
    searchBar.appendChild(container);
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildAdvancedSearchUI);
  } else {
    buildAdvancedSearchUI();
  }
})();
