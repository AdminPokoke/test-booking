(async () => {
  await requireAuth();

  // Load Google client ID from server settings
  const { google_client_id } = await (await fetch('/api/meeting/google-client-id')).json();
  let gClientId = google_client_id;
  if (!gClientId) {
    alert('Admin belum mengatur Google Client ID di halaman Admin → Settings. Anda tetap bisa melihat kalender tapi tidak bisa membuat event.');
  }

  // Load rooms
  const rooms = await API.get('/meeting/rooms');
  const sel = document.getElementById('roomSelect');
  sel.innerHTML = rooms.map(r => `<option value="${r.id}">${r.name} (cap ${r.capacity})</option>`).join('');

  // Google Auth state
  let googleAccessToken = null;
  let googleEmail = null;

  const btnGoogle = document.getElementById('btnGoogleLogin');
  const emailBadge = document.getElementById('googleEmail');

  // Init gapi client for Calendar if token acquired
  async function initGapi() {
    return new Promise((resolve) => {
      gapi.load('client', async () => {
        await gapi.client.init({});
        await gapi.client.load('calendar', 'v3');
        resolve();
      });
    });
  }

  async function requestGoogleToken() {
    if (!gClientId) return alert('Google Client ID belum di-set.');
    // Google Identity Services Token Client (no popup until requested)
    /* global google */
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: gClientId,
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
      callback: async (response) => {
        if (response.error) { alert('Google auth error'); return; }
        googleAccessToken = response.access_token;
        await initGapi();
        gapi.client.setToken({ access_token: googleAccessToken });
        // fetch email
        try {
          const me = await gapi.client.request({ path: 'https://www.googleapis.com/oauth2/v2/userinfo' });
          googleEmail = me.result.email;
          emailBadge.textContent = 'Google: ' + googleEmail;
        } catch (e) {
          emailBadge.textContent = 'Google token acquired';
        }
      }
    });
    tokenClient.requestAccessToken();
  }

  btnGoogle.onclick = requestGoogleToken;

  // FullCalendar setup
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    selectable: true,
    editable: false,
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    select: async (info) => {
      if (!googleAccessToken) {
        alert('Silakan login Google dulu untuk membuat event.');
        calendar.unselect(); return;
      }
      const title = prompt('Judul meeting:');
      if (!title) { calendar.unselect(); return; }
      const room_id = parseInt(sel.value, 10);

      // Create on Google Calendar (primary)
      let google_event_id = null;
      try {
        const resp = await gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: {
            summary: title,
            start: { dateTime: info.start.toISOString() },
            end: { dateTime: info.end.toISOString() }
          }
        });
        google_event_id = resp.result.id;
      } catch (e) {
        alert('Gagal membuat event di Google Calendar: ' + (e?.result?.error?.message || e.message));
        calendar.unselect(); return;
      }

      // Save to backend
      const res = await API.post('/meeting/book', {
        room_id, title, start_time: info.start, end_time: info.end, google_event_id, google_email: googleEmail
      });

      if (res?.ok) {
        alert('Meeting booked!');
        calendar.addEvent({ title, start: info.start, end: info.end, allDay: false });
      } else {
        // rollback on google? (optional)
        alert(res?.error || 'Gagal menyimpan booking backend');
      }
      calendar.unselect();
    }
  });
  calendar.render();
})();
