/* buttons.js
   Handles: add collaborator (modal), quick add row, delete (single & bulk), select-all,
   and persistence via localStorage. Depends on jQuery and that the HTML contains:
   - #form-add-collab, #btn-add-row, #btn-delete-selected, #btn-bulk-delete, #select-all
   - #table-body and <template id="row-template"> structure used in the page
*/

(function($){
	$(function(){
		// basic UI
		$('#year').text(new Date().getFullYear());

		const STORAGE_KEY = 'iriza_collaborators_v1';
		let collaborators = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

		// helpers
		function uid(num){
			return 'ID-' + String(num).padStart(3,'0');
		}
		function save(){
			localStorage.setItem(STORAGE_KEY, JSON.stringify(collaborators));
			refreshSummary();
		}
		function refreshSummary(){
			$('#summary-collab').text(collaborators.length);
			// placeholders for tasks/finance
			$('#summary-tasks').text(0);
			$('#summary-finance').text((0).toFixed(2));
			$('#modal-fin-outstanding').text((0).toFixed(2));
		}
		function renderRow(obj){
			const tpl = document.getElementById('row-template');
			const clone = tpl.content.cloneNode(true);
			const $tr = $(clone).find('tr');
			$tr.attr('data-id', obj.id);
			$tr.find('.id-cell').text(obj.id);
			$tr.find('.name-cell').text(obj.name);
			$tr.find('.role-cell').text(obj.role || 'Member');
			$tr.find('.phone-cell').text(obj.phone || '');
			$tr.find('.email-cell').text(obj.email || '');
			$tr.find('.loc-cell').text(obj.location || '');
			$('#table-body').append($tr);
		}

		// initial render
		$('#table-body').empty();
		if (collaborators.length){
			collaborators.forEach(renderRow);
		} else {
			// seed a single sample if empty (keeps UI friendly)
			const seed = { id: uid(1), name: 'David Aprilio', role:'Admin', phone:'+62-800-0000', email:'david@example.com', location:'HQ' };
			collaborators.push(seed);
			save();
			renderRow(seed);
		}
		refreshSummary();

		// Add collaborator via modal (form submit)
		$(document).on('submit', '#form-add-collab', function(e){
			e.preventDefault();
			const existingId = $('#collab-id').val().trim();
			const data = {
				name: $('#collab-name').val().trim(),
				role: $('#collab-role').val(),
				phone: $('#collab-phone').val().trim(),
				email: $('#collab-email').val().trim(),
				location: $('#collab-location').val().trim()
			};
			if (!data.name) { alert('Name is required'); return; }

			if (existingId){
				// edit existing
				const idx = collaborators.findIndex(c=>c.id===existingId);
				if (idx>-1){
					collaborators[idx] = Object.assign({id: existingId}, data);
					// update row in DOM
					const $tr = $('#table-body').find('tr[data-id="'+existingId+'"]');
					$tr.find('.name-cell').text(data.name);
					$tr.find('.role-cell').text(data.role);
					$tr.find('.phone-cell').text(data.phone);
					$tr.find('.email-cell').text(data.email);
					$tr.find('.loc-cell').text(data.location);
					save();
				}
			} else {
				// new collaborator
				const nextIndex = collaborators.length + 1;
				const newId = uid(nextIndex);
				const obj = Object.assign({ id: newId }, data);
				collaborators.push(obj);
				save();
				renderRow(obj);
			}
			// reset & hide
			$('#form-add-collab')[0].reset();
			$('#collab-id').val('');
			$('#modal-add-collab').modal('hide');
		});

		// Quick add row: add a default row using template (no modal)
		$(document).on('click', '#btn-add-row', function(){
			const nextIndex = collaborators.length + 1;
			const newId = uid(nextIndex);
			const obj = { id: newId, name: 'New Collaborator', role: 'Member', phone:'', email:'', location:'' };
			collaborators.push(obj);
			save();
			renderRow(obj);
		});

		// Single delete
		$(document).on('click', '.delete-row', function(e){
			e.preventDefault();
			if (!confirm('Delete this collaborator?')) return;
			const $tr = $(this).closest('tr');
			const id = $tr.data('id');
			$tr.remove();
			collaborators = collaborators.filter(c=>c.id!==id);
			save();
		});

		// select-all checkbox
		$(document).on('change', '#select-all', function(){
			const checked = $(this).is(':checked');
			$('.row-select').prop('checked', checked);
		});

		// Bulk delete (supports both buttons present on page)
		$(document).on('click', '#btn-delete-selected, #btn-bulk-delete', function(){
			const ids = [];
			$('.row-select:checked').each(function(){
				const id = $(this).closest('tr').data('id');
				if (id) ids.push(id);
			});
			if (!ids.length) { alert('No rows selected'); return; }
			if (!confirm('Delete ' + ids.length + ' selected collaborators?')) return;
			ids.forEach(id=>{
				$('#table-body').find('tr[data-id="'+id+'"]').remove();
				collaborators = collaborators.filter(c=>c.id!==id);
			});
			save();
			$('#select-all').prop('checked', false);
		});

		// Optional: refresh (simple reload)
		$(document).on('click', '#btn-refresh', function(){
			location.reload();
		});
	});
})(jQuery);
