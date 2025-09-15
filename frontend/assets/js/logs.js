(async () => {
  await requireAuth();
  if (window.currentUser.role !== 'admin') {
    alert('Admin only'); window.location = '/dashboard.html'; return;
  }

  const box = document.getElementById('logsBox');
  async function loadLogs() {
    const logs = await API.get('/logs');
    box.textContent = JSON.stringify(logs, null, 2);
  }
  document.getElementById('btnDownload').onclick = () => {
    window.location = '/api/logs/download.csv';
  };
  await loadLogs();
})();
