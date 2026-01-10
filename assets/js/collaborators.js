(function(){
  const API_URL = '/api/collaborators';
  const $tbody = document.getElementById('table-body');
  const rowTemplate = document.getElementById('row-template');
  const $form = document.getElementById('form-add-collab');
  const $modal = new bootstrap.Modal(document.getElementById('modal-add-collab'), {backdrop:'static'});
  const $selectAll = document.getElementById('select-all');
  let currentEditId = null;

  // Load collaborators from API
  async function fetchCollaborators(){
    try {
      const response = await fetch(API_URL);
      if(!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch(error){
      console.error('Fetch error:', error);
      alert('Error loading collaborators');
      return [];
    }
  }

  // Create new collaborator
  async function createCollaborator(data){
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      if(!response.ok) throw new Error('Failed to create');
      return await response.json();
    } catch(error){
      console.error('Create error:', error);
      alert('Error creating collaborator');
      return null;
    }
  }

  // Update collaborator
  async function updateCollaborator(id, data){
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      if(!response.ok) throw new Error('Failed to update');
      return await response.json();
    } catch(error){
      console.error('Update error:', error);
      alert('Error updating collaborator');
      return null;
    }
  }

  // Delete collaborator
  async function deleteCollaborator(id){
    try {
      const response = await fetch(`${API_URL}/${id}`, {method: 'DELETE'});
      if(!response.ok) throw new Error('Failed to delete');
      return true;
    } catch(error){
      console.error('Delete error:', error);
      alert('Error deleting collaborator');
      return false;
    }
  }

  // Update summary counts
  function updateSummary(data){
    const count = $tbody.querySelectorAll('tr').length;
    const el = document.getElementById('summary-collab');
    if (el) el.textContent = count;
  }

  // Clear table
  function clearTable(){
    $tbody.innerHTML = '';
  }

  // Render table from data
  function renderTable(data){
    clearTable();
    data.forEach(item => {
      const node = rowTemplate.content.cloneNode(true);
      const tr = node.querySelector('tr');
      tr.dataset.id = item.id;
      tr.querySelector('.id-cell').textContent = item.id || 'N/A';
      tr.querySelector('.name-cell').textContent = item.name || '';
      tr.querySelector('.role-cell').textContent = item.role || '';
      tr.querySelector('.phone-cell').textContent = item.phone || '';
      tr.querySelector('.email-cell').textContent = item.email || '';
      tr.querySelector('.loc-cell').textContent = item.location || '';

      // Delete button
      tr.querySelector('.delete-row').addEventListener('click', () => deleteRow(item.id));

      // Edit button
      tr.querySelector('.edit-row').addEventListener('click', () => openEditModal(item));

      // View button
      tr.querySelector('.view-row').addEventListener('click', () => {
        alert(`${item.name}\nRole: ${item.role}\nPhone: ${item.phone}\nEmail: ${item.email}\nLocation: ${item.location}`);
      });

      $tbody.appendChild(node);
    });
    $selectAll.checked = false;
    updateSummary(data);
  }

  // Delete single row
  async function deleteRow(id){
    if(!confirm('Delete this collaborator?')) return;
    if(await deleteCollaborator(id)){
      loadAndRender();
    }
  }

  // Open edit modal
  function openEditModal(item){
    currentEditId = item.id;
    document.getElementById('collab-id').value = item.id;
    document.getElementById('collab-name').value = item.name || '';
    document.getElementById('collab-role').value = item.role || 'Member';
    document.getElementById('collab-phone').value = item.phone || '';
    document.getElementById('collab-email').value = item.email || '';
    document.getElementById('collab-location').value = item.location || '';
    $modal.show();
  }

  // Form submit (add or update)
  $form.addEventListener('submit', async function(e){
    e.preventDefault();
    const name = document.getElementById('collab-name').value.trim();
    const role = document.getElementById('collab-role').value;
    const phone = document.getElementById('collab-phone').value.trim();
    const email = document.getElementById('collab-email').value.trim();
    const location = document.getElementById('collab-location').value.trim();

    if(!name || !email){
      alert('Name and Email are required');
      return;
    }

    const data = {name, role, phone, email, location};

    if(currentEditId){
      // Update
      await updateCollaborator(currentEditId, data);
    } else {
      // Create
      await createCollaborator(data);
    }

    $form.reset();
    currentEditId = null;
    $modal.hide();
    loadAndRender();
  });

  // Open modal for new collaborator
  document.getElementById('add-collaborator').addEventListener('click', function(){
    currentEditId = null;
    $form.reset();
    document.getElementById('collab-id').value = '';
    $modal.show();
  });

  // Delete selected rows
  async function deleteSelected(){
    const checked = Array.from(document.querySelectorAll('.row-select:checked'));
    if(!checked.length){
      alert('No rows selected');
      return;
    }
    if(!confirm(`Delete ${checked.length} selected collaborator(s)?`)) return;
    const ids = checked.map(cb => cb.closest('tr').dataset.id);
    
    for(const id of ids){
      await deleteCollaborator(id);
    }
    loadAndRender();
  }

  // Export CSV
  async function exportCSV(){
    const data = await fetchCollaborators();
    if(!data.length){
      alert('No collaborators to export');
      return;
    }
    const headers = ['ID','Name','Role','Telephone','Email','Location'];
    const rows = data.map(r => [r.id, r.name, r.role, r.phone, r.email, r.location]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collaborators.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Load and render
  async function loadAndRender(){
    const data = await fetchCollaborators();
    renderTable(data);
  }

  // Event listeners
  document.getElementById('btn-export').addEventListener('click', exportCSV);
  document.getElementById('btn-bulk-delete').addEventListener('click', deleteSelected);
  document.getElementById('btn-delete-selected').addEventListener('click', deleteSelected);
  document.getElementById('select-all').addEventListener('change', function(){
    document.querySelectorAll('.row-select').forEach(cb => { cb.checked = this.checked; });
  });

  document.addEventListener('DOMContentLoaded', function () {
	const tbody = document.getElementById('table-body');
	const template = document.getElementById('row-template');
	const form = document.getElementById('form-add-collab');
	const modalEl = document.getElementById('modal-add-collab');
	let bsModal;
	if (modalEl && window.bootstrap) bsModal = new bootstrap.Modal(modalEl);

	function updateSummary() {
		const count = tbody.querySelectorAll('tr').length;
		const el = document.getElementById('summary-collab');
		if (el) el.textContent = count;
	}

	// Add collaborator from modal
	if (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			const id = (document.getElementById('input-id') || {}).value?.trim();
			const restaurant = (document.getElementById('input-restaurant') || {}).value?.trim();
			const location = (document.getElementById('input-location') || {}).value?.trim();
			const number = (document.getElementById('input-number') || {}).value?.trim();
			const hours = (document.getElementById('input-hours') || {}).value?.trim();

			if (!id || !restaurant) {
				alert('Please provide ID and Restaurant name.');
				return;
			}

			const clone = template.content.cloneNode(true);
			const tr = clone.querySelector('tr');
			if (tr) {
				tr.setAttribute('data-id', id);
				const setText = (sel, txt) => { const el = tr.querySelector(sel); if (el) el.textContent = txt || ''; };
				setText('.id-cell', id);
				setText('.restaurant-cell', restaurant);
				setText('.loc-cell', location);
				setText('.phone-cell', number);
				setText('.hours-cell', hours);
				tbody.appendChild(clone);
				updateSummary();
			}

			form.reset();
			if (bsModal) bsModal.hide();
		});
	}

	// Delegate delete-row clicks
	tbody.addEventListener('click', function (ev) {
		const btn = ev.target.closest && ev.target.closest('.delete-row');
		if (btn) {
			const tr = btn.closest('tr');
			if (tr) {
				tr.remove();
				updateSummary();
			}
		}
	});

	// Select all / delete selected
	const selectAll = document.getElementById('select-all');
	if (selectAll) {
		selectAll.addEventListener('change', function () {
			const checked = !!this.checked;
			tbody.querySelectorAll('.row-select').forEach(cb => cb.checked = checked);
		});
	}

	const btnDeleteSelected = document.getElementById('btn-delete-selected');
	if (btnDeleteSelected) {
		btnDeleteSelected.addEventListener('click', function () {
			const rows = Array.from(tbody.querySelectorAll('.row-select:checked'));
			if (!rows.length) return;
			rows.forEach(cb => {
				const tr = cb.closest('tr');
				if (tr) tr.remove();
			});
			if (selectAll) selectAll.checked = false;
			updateSummary();
		});
	}

	// Initial summary update
	updateSummary();
});

  // Initial load
  loadAndRender();
})();
