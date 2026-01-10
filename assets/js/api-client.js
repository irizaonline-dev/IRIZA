const API = (function(){
	// determine API base (runtime-configurable):
	// 1) window.__API_BASE__ (set by server or embed script)
	// 2) <meta name="api-base" content="...">
	// 3) URL query param ?api_base=...
	// 4) fallback to same-origin (window.location.origin + '/api')
	(function(){
		// small helper to read ?api_base=... from URL
		function getQueryParam(name){
			try {
				return new URLSearchParams(window.location.search).get(name);
			} catch(e) { return null; }
		}

		// Priority: explicit global -> meta tag -> query param -> environment-like process.env (build-time) -> default (same-origin + /api)
		var runtimeBase =
			(typeof window !== 'undefined' && window.__API_BASE__) ||
			(document.querySelector && document.querySelector('meta[name="api-base"]') && document.querySelector('meta[name="api-base"]').content) ||
			getQueryParam('api_base') ||
			(typeof process !== 'undefined' && process.env && process.env.API_BASE) ||
			(window.location && (window.location.origin || (window.location.protocol + '//' + window.location.host)) + '/api');

		// Expose for other modules / inline scripts to consume
		window.apiBase = runtimeBase;

		// If the original code referenced a `base` variable, set it (uncomment if needed):
		// var base = runtimeBase;
	})();

	const TOKEN_KEY = 'iriza_api_token_v1';
	function getStoredToken(){ try { return localStorage.getItem(TOKEN_KEY); } catch(e){ return null; } }
	function setStoredToken(t){ try { if(t) localStorage.setItem(TOKEN_KEY,t); else localStorage.removeItem(TOKEN_KEY); } catch(e){} }

	async function req(path, opts){
		opts = opts || {};
		// ensure cookies (refresh token) are included for cross-origin requests
		if (!opts.credentials) opts.credentials = 'include';
		opts.headers = Object.assign({'Content-Type':'application/json'}, opts.headers||{});
		// attach token if present
		const token = getStoredToken();
		if(token) opts.headers.Authorization = 'Bearer ' + token;

		if(opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);

		try {
			const res = await fetch(window.apiBase + path, opts);
			if(!res.ok) {
				const txt = await res.text();
				throw new Error('API error ' + res.status + ' ' + txt);
			}
			const ct = res.headers.get('content-type') || '';
			if(ct.indexOf('application/json') === -1) return null;
			return res.json();
		} catch (err) {
			// best-effort fallback for GET list endpoints -> try to read /db.json on same origin
			if ((opts.method || 'GET').toUpperCase() === 'GET' && path.indexOf('/api/') === 0) {
				try {
					const baseOrigin = (window.location && window.location.origin) ? window.location.origin : '';
					const r = await fetch(baseOrigin + '/db.json');
					if(!r.ok) throw new Error('db.json not available');
					const db = await r.json();
					const key = path.replace('/api/','').split('/')[0];
					if (key && db.hasOwnProperty(key)) return db[key];
				} catch(e){
					// swallow fallback errors
				}
			}
			throw err;
		}
	}

	// helper to POST JSON to arbitrary webhook URL (client-side, fire-and-forget)
	async function postJsonToUrl(url, data, timeoutMs){
		try{
			const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
			if(controller && timeoutMs) setTimeout(()=>controller.abort(), timeoutMs);
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
				signal: controller ? controller.signal : undefined
			});
			// don't throw on non-2xx because we don't want to break client flow
			return { ok: res.ok, status: res.status };
		}catch(e){
			// network/abort errors are ignored (logged)
			console.warn('Webhook post failed', url, e && e.message);
			return { ok:false, error: e && e.message };
		}
	}

	// try to load webhooks from static /db.json (best-effort) and send to matching event URLs
	async function sendToAllWebhooks(event, payload){
		try{
			const res = await fetch(window.apiBase + '/db.json');
			if(!res.ok) return;
			const db = await res.json();
			const hooks = Array.isArray(db.webhooks) ? db.webhooks : [];
			const matching = hooks.filter(h => !h.events || h.events.length === 0 || h.events.indexOf(event) !== -1);
			matching.forEach(h => {
				// fire-and-forget
				postJsonToUrl(h.url, { event, payload, timestamp: new Date().toISOString() }, 5000);
			});
		}catch(e){
			// ignore errors (client-side helper)
			console.warn('sendToAllWebhooks failed', e && e.message);
		}
	}

	return (window.API = {
		auth: {
			// register returns { user, token }
			register: async (payload) => {
				const res = await req('/api/auth/register', { method:'POST', body: payload });
				if (res && res.token) setStoredToken(res.token);
				return res;
			},
			login: async (payload) => {
				const res = await req('/api/auth/login', { method:'POST', body: payload });
				if (res && res.token) setStoredToken(res.token);
				return res;
			},
			me: async () => {
				return req('/api/auth/me');
			},
			logout: () => { setStoredToken(null); return Promise.resolve(true); },
			getToken: () => getStoredToken(),
			setToken: (t) => { setStoredToken(t); }
		},
		reservations: {
			list: ()=> req('/api/reservations'),
			get: id=> req('/api/reservations/'+encodeURIComponent(id)),
			create: data=> req('/api/reservations', { method:'POST', body: data }),
			update: (id,data)=> req('/api/reservations/'+encodeURIComponent(id), { method:'PUT', body:data }),
			delete: id=> req('/api/reservations/'+encodeURIComponent(id), { method:'DELETE' })
		},
		staff: {
			list: ()=> req('/api/staff'),
			create: d=> req('/api/staff',{method:'POST', body:d}),
			update: (id,d)=> req('/api/staff/'+encodeURIComponent(id), {method:'PUT', body:d}),
			delete: id=> req('/api/staff/'+encodeURIComponent(id), {method:'DELETE'})
		},
		menu: {
			list: ()=> req('/api/menu'),
			create: d=> req('/api/menu',{method:'POST', body:d}),
			update: (id,d)=> req('/api/menu/'+encodeURIComponent(id), {method:'PUT', body:d}),
			delete: id=> req('/api/menu/'+encodeURIComponent(id), {method:'DELETE'})
		},
		inventory: {
			list: ()=> req('/api/inventory'),
			create: d=> req('/api/inventory',{method:'POST', body:d}),
			update: (id,d)=> req('/api/inventory/'+encodeURIComponent(id), {method:'PUT', body:d}),
			delete: id=> req('/api/inventory/'+encodeURIComponent(id), {method:'DELETE'})
		},
		suppliers: {
			list: ()=> req('/api/suppliers'),
			create: d=> req('/api/suppliers',{method:'POST', body:d})
		},
		collaborators: {
			list: ()=> req('/api/collaborators'),
			create: d=> req('/api/collaborators',{method:'POST', body:d}),
			delete: id=> req('/api/collaborators/'+encodeURIComponent(id), {method:'DELETE'})
		},
		orders: {
			create: d=> req('/api/orders', { method:'POST', body: d }),
			list: ()=> req('/api/orders')
		},
		webhooks: {
			list: ()=> req('/api/webhooks'),
			create: d=> req('/api/webhooks', { method:'POST', body: d }),
			delete: id=> req('/api/webhooks/'+encodeURIComponent(id), { method:'DELETE' }),
			send: (url, data) => (async function(){ 
				try{ await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); }catch(e){ console.warn('webhook send failed', e); }
			})(),
			sendToAllWebhooks: (event, payload) => sendToAllWebhooks(event,payload)
		}
	});
})();
