document.getElementById('btnLogin').onclick = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const res = await API.post('/auth/login', { email, password });
  if (res?.token) {
    API.setToken(res.token);
    window.location = '/dashboard.html';
  } else alert(res?.error || 'Login gagal');
};

document.getElementById('btnRegister').onclick = async () => {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const res = await API.post('/auth/register', { name, email, password });
  if (res?.ok) alert('Register sukses, silakan login');
  else alert(res?.error || 'Register gagal');
};
