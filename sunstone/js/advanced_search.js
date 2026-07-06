// Advanced VM search UI
(function($) {
    'use strict';

    // Options for advanced search dropdown, will be populated from server config
    var advancedKeys = [];

    function initAdvancedSearch() {
        // Fetch configuration from server or embedded in page
        // Assume window.advancedSearchConfig is set from server
        if (window.advancedSearchConfig) {
            advancedKeys = window.advancedSearchConfig;
        }

        // Add the advanced search bar after the regular search input
        var searchContainer = $('.vm-search-container');
        var html = `<div class="advanced-search" style="margin-top: 10px;">
            <select id="advanced-search-key" class="form-control" style="width: auto; display: inline-block;">
                <option value="">-- Select attribute --</option>
                ${advancedKeys.map(k => `<option value="${k.key}" data-regex="${k.regex}">${k.key}</option>`).join('')}
            </select>
            <input type="text" id="advanced-search-value" class="form-control" placeholder="Search value" style="width: 200px; display: inline-block;" />
            <button id="advanced-search-btn" class="btn btn-default">Search</button>
        </div>`;
        searchContainer.append(html);

        // Bind search event
        $('#advanced-search-btn').on('click', function() {
            var key = $('#advanced-search-key').val();
            var value = $('#advanced-search-value').val();
            var regex = $('#advanced-search-key option:selected').data('regex');
            if (key && value) {
                // Trigger VM table reload with extra parameters
                var url = new URL(window.location);
                url.searchParams.set('adv_key', key);
                url.searchParams.set('adv_regex', regex);
                url.searchParams.set('adv_value', value);
                window.location.href = url.toString();
            }
        });
    }

    $(document).ready(function() {
        initAdvancedSearch();
    });
})(jQuery);