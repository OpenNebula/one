// Sunstone VM List View - Advanced Search
// Adds a dropdown to select a searchable attribute and a text input for value.
// Requires configuration file deep_vm_search attributes.

(function() {
  'use strict';

  var vm = this;

  // Extend the standard search bar with advanced options
  vm.advancedSearchEnabled = false;
  vm.searchAttributes = [];
  vm.selectedAttribute = null;
  vm.advancedSearchValue = '';

  // Load advanced search attributes from the server configuration
  vm.loadAdvancedSearchConfig = function() {
    $.get('/sunstone/vm/config/deep_vm_search', function(data) {
      if (data && data.attributes) {
        vm.searchAttributes = data.attributes.map(function(attr) {
          return { key: attr, label: attr.split('=')[0].trim() };
        });
        vm.advancedSearchEnabled = vm.searchAttributes.length > 0;
      }
    });
  };

  // Toggle advanced search dropdown
  vm.toggleAdvancedSearch = function() {
    if (!vm.searchAttributes.length) {
      vm.loadAdvancedSearchConfig();
    }
    vm.advancedSearchVisible = !vm.advancedSearchVisible;
  };

  // Perform advanced search
  vm.doAdvancedSearch = function() {
    if (!vm.selectedAttribute || !vm.advancedSearchValue) return;
    vm.filterByColumn(vm.selectedAttribute.key, vm.advancedSearchValue);
  };

  // Initialize
  vm.initAdvancedSearch = function() {
    vm.advancedSearchVisible = false;
    vm.loadAdvancedSearchConfig();
  };

  // Override the existing filter behavior to incorporate advanced search
  var originalFilterByColumn = vm.filterByColumn;
  vm.filterByColumn = function(column, value) {
    // If using advanced search, send the full attribute path
    // The backend should handle the regex from the config
    originalFilterByColumn.call(vm, column, value);
  };

  // Add DOM elements for advanced search (assumes a standard Sunstone view)
  vm.advancedSearchTemplate = `
    <div class="advanced-search dropdown" style="display:inline-block; margin-left:10px;">
      <button class="btn btn-sm btn-default dropdown-toggle" type="button" id="advancedSearchMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true" ng-click="toggleAdvancedSearch()">
        <i class="fa fa-search-plus"></i> Advanced
      </button>
      <ul class="dropdown-menu" aria-labelledby="advancedSearchMenu" ng-if="advancedSearchVisible">
        <li ng-repeat="attr in searchAttributes">
          <a href="#" ng-click="selectedAttribute = attr; advancedSearchVisible = false">{{ attr.label }}</a>
        </li>
        <li role="separator" class="divider" ng-if="selectedAttribute"></li>
        <li ng-if="selectedAttribute">
          <form ng-submit="doAdvancedSearch()">
            <div class="input-group" style="padding: 5px 10px;">
              <input type="text" class="form-control input-sm" placeholder="Value..." ng-model="advancedSearchValue">
              <span class="input-group-btn">
                <button class="btn btn-sm btn-primary" type="submit">Search</button>
              </span>
            </div>
          </form>
        </li>
      </ul>
    </div>
  `;

  // On view load
  vm.initAdvancedSearch();

})();
