// Advanced VM search module
// Must be loaded after config is available

(function() {
  // Load search keys from config (assumes global config object)
  const searchKeys = (typeof sunstone_config !== 'undefined' && sunstone_config.vm_search_keys) || {};

  // Add advanced search UI to VM table toolbar
  function addAdvancedSearch() {
    const tableId = 'vms_table';
    const toolbar = document.querySelector(`#${tableId}_toolbar`);
    if (!toolbar) return;

    // Create advanced search container
    const container = document.createElement('div');
    container.className = 'advanced-search';
    container.innerHTML = `
      <select id="adv_search_key" class="form-control input-sm" style="width: auto; display: inline-block;">
        <option value="">Advanced filter...</option>
        ${Object.keys(searchKeys).map(key => `<option value="${key}">${key}</option>`).join('')}
      </select>
      <input type="text" id="adv_search_value" class="form-control input-sm" placeholder="Filter value" disabled style="width: 200px; display: inline-block;">
    `;
    toolbar.appendChild(container);

    // Bind events
    const keySelect = document.getElementById('adv_search_key');
    const valueInput = document.getElementById('adv_search_value');

    keySelect.addEventListener('change', function() {
      valueInput.disabled = !this.value;
      if (!this.value) {
        valueInput.value = '';
        applyFilter();
      }
    });

    valueInput.addEventListener('input', function() {
      applyFilter();
    });
  }

  // Apply filter on VM table
  function applyFilter() {
    const table = $('#vms_table').DataTable();
    if (!table) return;

    const key = document.getElementById('adv_search_key').value;
    const value = document.getElementById('adv_search_value').value;

    // Remove previous custom filter
    $.fn.dataTable.ext.search.pop();

    if (!key || !value) {
      table.draw();
      return;
    }

    const pattern = searchKeys[key];
    if (!pattern) {
      console.warn('No regex pattern for key:', key);
      table.draw();
      return;
    }

    const regex = new RegExp('^' + pattern.replace(/^\^?/, '').replace(/\$?$/, '') + '$'); // adjust anchoring
    // Actually use the pattern as given; user provides anchored pattern in config

    const fullRegex = new RegExp(pattern);

    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
      const rowData = table.row(dataIndex).data();
      // Extract template attributes from row hidden data (custom attribute)
      // Assume VM table rows have a data-template attribute with JSON
      const templateStr = $(table.row(dataIndex).node()).attr('data-template');
      if (!templateStr) return true; // if no template, show all

      let template;
      try {
        template = JSON.parse(templateStr);
      } catch (e) {
        return true;
      }

      // Navigate nested keys (e.g., graphics_type becomes template.graphics.type? Actually it's flat in OpenNebula VM template)
      const valueToTest = template[key];
      if (valueToTest === undefined || valueToTest === null) return false;

      return fullRegex.test(String(valueToTest));
    });

    table.draw();
  }

  // Initialize when document is ready
  $(document).ready(function() {
    if (Object.keys(searchKeys).length > 0) {
      addAdvancedSearch();
    }
  });
})();