document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const advancedSelect = document.getElementById('advanced-search-attr');
  const advancedToggle = document.getElementById('advanced-search-toggle');

  advancedToggle.addEventListener('click', function() {
    const isVisible = advancedSelect.style.display !== 'none';
    advancedSelect.style.display = isVisible ? 'none' : 'inline-block';
  });

  searchInput.addEventListener('input', function() {
    const query = searchInput.value;
    const attr = advancedSelect.value;
    // Trigger AJAX call to filter VMs
    fetch(`/vm/search?query=${encodeURIComponent(query)}&attr=${encodeURIComponent(attr)}`)
      .then(response => response.json())
      .then(data => {
        // Update VM table with data
        updateVMTable(data);
      });
  });

  function updateVMTable(vms) {
    // Implementation to refresh table rows
    const tableBody = document.getElementById('vm-table-body');
    tableBody.innerHTML = '';
    vms.forEach(vm => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${vm.name}</td><td>${vm.state}</td>`; // etc.
      tableBody.appendChild(row);
    });
  }
});