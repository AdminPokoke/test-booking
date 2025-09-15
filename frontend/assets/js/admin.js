(async () => {
  await requireAuth();
  if (window.currentUser.role !== 'admin') {
    alert('Admin only'); window.location = '/dashboard.html'; return;
  }

  // Parking slots
  async function loadSlots() {
    const slots = await API.get('/admin/parking-slots');
    document.getElementById('slotList').innerHTML =
      slots.map(s => `<li>${s.code} ${s.is_active ? '' : '(inactive)'}</li>`).join('');
  }
  document.getElementById('btnAddSlot').onclick = async () => {
    const code = document.getElementById('newSlot').value.trim();
    if (!code) return;
    await API.post('/admin/parking-slots', { code });
    await loadSlots();
  };

  // Rooms
  async function loadRooms() {
    const rooms = await API.get('/admin/rooms');
    document.getElementById('roomList').innerHTML =
      rooms.map(r => `<li>${r.name} (cap ${r.capacity})</li>`).join('');
  }
  document.getElementById('btnAddRoom').onclick = async () => {
    const name = document.getElementById('newRoom').value.trim();
    const capacity = parseInt(document.getElementById('newRoomCap').value || '4', 10);
    if (!name) return;
    await API.post('/admin/rooms', { name, capacity });
    await loadRooms();
  };

  // Settings
  async function loadSettings() {
    const s = await API.get('/admin/settings');
    document.getElementById('slackUrl').value = s.slack_webhook_url || '';
    document.getElementById('googleClientId').value = s.google_client_id || '';
  }
  document.getElementById('btnSaveSettings').onclick = async () => {
    const slack_webhook_url = document.getElementById('slackUrl').value.trim();
    const google_client_id = document.getElementById('googleClientId').value.trim();
    await API.post('/admin/settings', { slack_webhook_url, google_client_id });
    document.getElementById('settingsSaved').textContent = 'Saved ✔';
    setTimeout(()=> document.getElementById('settingsSaved').textContent='', 2000);
  };

  await Promise.all([loadSlots(), loadRooms(), loadSettings()]);
})();
