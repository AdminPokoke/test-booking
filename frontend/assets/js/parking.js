(async () => {
  await requireAuth();

  const calEl = document.getElementById('parkingCalendar');
  let calendar = null;

  async function loadSlots() {
    const slots = await API.get('/parking/slots');
    const sel = document.getElementById('slotSelect');
    sel.innerHTML = slots.map(s => `<option value="${s.id}">${s.code}${s.is_active? '' : ' (inactive)'}</option>`).join('');
    if (slots.length && !calendar) initCalendar();
    refreshCalendar();
  }
  async function loadStats() {
    const st = await API.get('/parking/stats');
    document.getElementById('parkingStats').innerText = JSON.stringify(st);
  }

  function initCalendar(){
    calendar = new FullCalendar.Calendar(calEl, {
      initialView: 'timeGridWeek',
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
      events: async (info, success, failure) => {
        try {
          const slot_id = document.getElementById('slotSelect').value;
          const data = await API.get('/parking/bookings?slot_id='+slot_id);
          success(data.map(b => ({
            id: b.id,
            title: 'Booked',
            start: b.start_time,
            end: b.end_time
          })));
        } catch (e) { failure(e); }
      }
    });
    calendar.render();
    document.getElementById('slotSelect').addEventListener('change', refreshCalendar);
  }

  function refreshCalendar(){
    if (calendar) calendar.refetchEvents();
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
      refreshCalendar();
    } else alert(res?.error || 'Gagal booking');
  };
})();
