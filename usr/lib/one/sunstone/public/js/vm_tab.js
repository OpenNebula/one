// Extend VM table search with advanced deep search.
(function() {
  const advancedSearchContainer = document.createElement('div');
  advancedSearchContainer.className = 'advanced-search';
  advancedSearchContainer.innerHTML = `
    <select id="vm-deep-search-key">
      <option value="">All attributes</option>
    </select>
    <input type="text" id="vm-deep-search-input" placeholder="Deep search..." />
    <button id="vm-deep-search-btn">Search</button>
  `;
  document.querySelector('.dataTables_filter').after(advancedSearchContainer);

  // Fetch search keys from server (or from config exposed to frontend)
  fetch('/vm/search_keys')
    .then(response => response.json())
    .then(keys => {
      const select = document.getElementById('vm-deep-search-key');
      keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        select.appendChild(option);
      });
    });

  document.getElementById('vm-deep-search-btn').addEventListener('click', function() {
    const term = document.getElementById('vm-deep-search-input').value;
    const key = document.getElementById('vm-deep-search-key').value;
    // Add term to existing search filter or make a custom request
    // For simplicity, we'll use DataTables search and filter via API
    // This is a placeholder; actual implementation would call backend endpoint.
    console.log('Deep search:', term, key);
    // Reload table with custom filter
    vmTable.api().search(term).draw();
  });
})();
