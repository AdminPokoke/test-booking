(async () => {
  await requireAuth();

  async function loadSlots() {
    const slots = await API.get('/parking/slots');
    const sel = document.getElementById('slotSelect');
    sel.innerHTML = slots.map(s => `<option value="${s.id}">${s.code}${s.is_active? '' : ' (inactive)'}</option>`).join('');
  }
  async function loadStats() {
    const st = await API.get('/parking/stats');
    document.getElementById('parkingStats').innerText = JSON.stringify(st, null, 2);
  }
  await loadSlots();
  await loadStats();

  document.getElementById('btnBookParking').onclick = async () => {
    const slot_id = parseInt(document.getElementById('slotSelect').value, 10);
    const start_time = document.getElementById('pStart').value;
    const end_time = document.getElementById('pEnd').value;
    const res = await API.post('/parking/book', { slot_id, start_time, end_time });
    if (res?.ok) {
      alert('Booked!');
      await loadStats();
    } else alert(res?.error || 'Gagal booking');
  };
})();
