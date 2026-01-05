(function(){
  const tableBody = document.getElementById('wh-body');
  const alerts = document.getElementById('alerts');
  const btnAdd = document.getElementById('btn-add');
  const inpUrl = document.getElementById('wh-url');
  const inpEvents = document.getElementById('wh-events');
  function showAlert(msg, type='success', timeout=4000){
    const el = document.createElement('div');
    el.className = 'alert alert-' + type + ' py-1';
    el.textContent = msg;
    alerts.appendChild(el);
    setTimeout(()=> el.remove(), timeout);
  }

  async function fetchWebhooks(){
    try{
      const list = await API.webhooks.list();
      if(Array.isArray(list)) return list;
      // some servers respond with {webhooks: [...]}
      if(list && Array.isArray(list.webhooks)) return list.webhooks;
      return [];
    }catch(e){
      // fallback to reading db.json for a read-only listing
      try{
        const base = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:3000';
        const r = await fetch(base + '/db.json');
        if(!r.ok) throw new Error('no db.json');
        const db = await r.json();
        return Array.isArray(db.webhooks) ? db.webhooks : [];
      }catch(err){
        console.warn('fetchWebhooks fallback failed', err);
        return [];
      }
    }
  }

  function render(list){
    tableBody.innerHTML = '';
    if(!list || list.length === 0){
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4" class="text-center text-muted small">No webhooks configured</td>';
      tableBody.appendChild(tr);
      return;
    }
    list.forEach(w => {
      const tr = document.createElement('tr');
      const events = Array.isArray(w.events) ? w.events.join(', ') : (w.events || '');
      tr.innerHTML = '<td class="align-middle">' + (w.id || '') + '</td>'
                   + '<td class="align-middle text-truncate" style="max-width:360px;">' + (w.url || '') + '</td>'
                   + '<td class="align-middle">' + (events || '<span class="text-muted small">all</span>') + '</td>'
                   + '<td class="text-end align-middle"><button class="btn btn-sm btn-outline-danger btn-delete">Delete</button></td>';
      tr.querySelector('.btn-delete').addEventListener('click', function(){
        if(!w.id){ showAlert('Cannot delete webhook without id', 'warning'); return; }
        if(!confirm('Delete webhook ' + w.id + '?')) return;
        deleteWebhook(w.id);
      });
      tableBody.appendChild(tr);
    });
  }

  async function loadAndRender(){
    const items = await fetchWebhooks();
    render(items);
  }

  async function createWebhook(url, eventsArr){
    try{
      const payload = { url: url, events: eventsArr };
      await API.webhooks.create(payload);
      showAlert('Webhook created', 'success');
      await loadAndRender();
    }catch(e){
      console.error(e);
      showAlert('Create failed (server may not support /api/webhooks). See console.', 'danger', 6000);
    }
  }

  async function deleteWebhook(id){
    try{
      await API.webhooks.delete(id);
      showAlert('Webhook deleted', 'success');
      await loadAndRender();
    }catch(e){
      console.error(e);
      showAlert('Delete failed (server may not support /api/webhooks). See console.', 'danger', 6000);
    }
  }

  // wire add form
  btnAdd.addEventListener('click', function(ev){
    ev.preventDefault();
    const url = inpUrl.value.trim();
    if(!url){ inpUrl.focus(); return; }
    const evText = inpEvents.value.trim();
    const eventsArr = evText ? evText.split(',').map(s=>s.trim()).filter(Boolean) : [];
    createWebhook(url, eventsArr);
    inpUrl.value = ''; inpEvents.value = '';
  });

  // initial load
  loadAndRender();
})();
