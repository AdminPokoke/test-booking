const API = {
  base: '',
  tokenKey: 'jwt',
  setToken(t){ localStorage.setItem(this.tokenKey, t) },
  getToken(){ return localStorage.getItem(this.tokenKey) },
  async get(path){
    const r = await fetch('/api'+path, { headers: this.authHeaders() });
    if (r.status === 401) { window.location = '/index.html'; return; }
    return r.json();
  },
  async post(path, data){
    const r = await fetch('/api'+path, {
      method:'POST',
      headers: { 'Content-Type':'application/json', ...this.authHeaders() },
      body: JSON.stringify(data)
    });
    if (r.status === 401) { window.location = '/index.html'; return; }
    return r.json();
  },
  authHeaders(){
    const t = this.getToken();
    return t ? { 'Authorization': 'Bearer '+t } : {};
  }
};

async function requireAuth(){
  const me = await API.get('/me');
  if (!me?.id) window.location = '/index.html';
  else window.currentUser = me;
}
