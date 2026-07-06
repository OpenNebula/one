// This file contains the original VM tab logic. We've added hooks for advanced search.
// For brevity, we show only the modification to include the advanced search module.

// Existing code... (truncated for deliverable)
// Add after initializing the VM data table:

// Load advanced search plugin
if (typeof Sunstone !== 'undefined' && Sunstone.vm_search_keys && Sunstone.vm_search_keys.length > 0) {
    $.getScript('/public/js/plugins/vms-tab.js', function() {
        // Plugin will initialize itself
    });
}