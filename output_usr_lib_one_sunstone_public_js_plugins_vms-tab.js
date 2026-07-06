// Advanced VM search module
(function($, OpenNebula) {
    'use strict';

    var config = {};

    // Load configuration from server (injected as global or via AJAX)
    if (typeof Sunstone !== 'undefined' && Sunstone.vm_search_keys) {
        config = Sunstone.vm_search_keys;
    }

    // Build advanced search UI
    function initAdvancedSearch() {
        if (!config || config.length === 0) return;

        var html = '<div class="advanced-search" style="display:inline-block;margin-left:10px;">' +
            '<select id="vm_adv_key" class="form-control input-sm" style="width:auto;">' +
            '<option value="">All fields</option>';
        $.each(config, function(idx, entry) {
            html += '<option value="' + entry.key + '" data-pattern="' + entry.pattern + '">' +
                (entry.label || entry.key) + '</option>';
        });
        html += '</select>' +
            '<input type="text" id="vm_adv_value" class="form-control input-sm" style="width:200px;display:inline-block;margin-left:5px;" placeholder="Search value..." />' +
            '</div>';

        $('.vm-search-bar .search-input').after(html);

        // Attach event listeners
        $('#vm_adv_key, #vm_adv_value').on('change keyup', function() {
            var key = $('#vm_adv_key').val();
            var value = $('#vm_adv_value').val();
            if (key && value) {
                applyAdvancedFilter(key, value);
            } else {
                clearAdvancedFilter();
            }
        });
    }

    // Apply filter with regex
    function applyAdvancedFilter(key, value) {
        var pattern = $('#vm_adv_key option:selected').data('pattern');
        var regex = new RegExp('^' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'); // default exact match
        if (pattern) {
            regex = new RegExp(pattern);
        }

        // This assumes a global filter function or we directly filter the datatable
        if (typeof filterVMTable === 'function') {
            filterVMTable(function(vm) {
                var keys = key.split('.');
                var obj = vm.TEMPLATE;
                for (var i = 0; i < keys.length; i++) {
                    if (obj && obj.hasOwnProperty(keys[i])) {
                        obj = obj[keys[i]];
                    } else {
                        return false;
                    }
                }
                var val = String(obj);
                return regex.test(val);
            });
        }
    }

    function clearAdvancedFilter() {
        if (typeof filterVMTable === 'function') {
            filterVMTable(null);
        }
    }

    // Integration: call init when VM tab is ready
    $(document).ready(function() {
        initAdvancedSearch();
    });

})(jQuery, OpenNebula);