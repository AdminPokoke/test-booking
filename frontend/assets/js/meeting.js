(async () => {
  await requireAuth();

  // Load Google client ID from server settings
  const { google_client_id } = await (await fetch('/api/meeting/google-client-id')).json();
  let gClientId = google_client_id;
  if (!gClientId) {
    alert('Admin belum mengatur Google Client ID di halaman Admin → Settings. Anda tetap bisa melihat kalender tapi tidak bisa membuat/mengelola event.');
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
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: gClientId,
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
      callback: async (response) => {
        if (response.error) { alert('Google auth error'); return; }
        googleAccessToken = response.access_token;
        await initGapi();
        gapi.client.setToken({ access_token: googleAccessToken });
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
  let calendar = null;

  function initCalendar(){
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'timeGridWeek',
      selectable: true,
      editable: true, // enable drag & drop for reschedule
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },

      events: async (info, success, failure) => {
        try {
          const data = await API.get('/meeting/bookings');
          success(data.map(m => ({
            id: m.id,
            title: m.title,
            start: m.start_time,
            end: m.end_time,
            extendedProps: { google_event_id: m.google_event_id }
          })));
        } catch (e) { failure(e); }
      },

      select: async (info) => {
        if (!googleAccessToken) { alert('Login Google dulu.'); calendar.unselect(); return; }
        const title = prompt('Judul meeting:');
        if (!title) { calendar.unselect(); return; }
        const room_id = parseInt(sel.value, 10);

        // Create on Google Calendar (primary)
        let google_event_id = null;
        try {
          const resp = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: { summary: title, start: { dateTime: info.start.toISOString() }, end: { dateTime: info.end.toISOString() } }
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
          calendar.addEvent({ id: res.booking.id, title, start: info.start, end: info.end, allDay: false });
        } else {
          alert(res?.error || 'Gagal menyimpan booking backend');
        }
        calendar.unselect();
      },

      eventChange: async (changeInfo) => {
        // Reschedule
        if (!googleAccessToken) { alert('Login Google dulu untuk reschedule.'); changeInfo.revert(); return; }
        const ev = changeInfo.event;
        const google_event_id = ev.extendedProps.google_event_id;
        try {
          if (google_event_id) {
            await gapi.client.calendar.events.patch({
              calendarId: 'primary',
              eventId: google_event_id,
              resource: {
                start: { dateTime: ev.start.toISOString() },
                end: { dateTime: ev.end.toISOString() }
              }
            });
          }
          const res = await fetch('/api/meeting/bookings/'+ev.id, {
            method:'PATCH',
            headers: { 'Content-Type':'application/json', ...API.authHeaders() },
            body: JSON.stringify({ start_time: ev.start, end_time: ev.end })
          });
          if (!res.ok) throw new Error('Backend update failed');
        } catch (e) {
          alert('Reschedule gagal: '+ e.message);
          changeInfo.revert();
        }
      },

      eventClick: async (clickInfo) => {
        // Cancel
        const ev = clickInfo.event;
        const doDel = confirm('Hapus event ini?');
        if (!doDel) return;
        if (!googleAccessToken) { alert('Login Google dulu untuk cancel.'); return; }
        try {
          const google_event_id = ev.extendedProps.google_event_id;
          if (google_event_id) {
            await gapi.client.calendar.events.delete({ calendarId: 'primary', eventId: google_event_id });
          }
          const res = await fetch('/api/meeting/bookings/'+ev.id, { method:'DELETE', headers: API.authHeaders() });
          if (!res.ok) throw new Error('Backend delete failed');
          ev.remove();
        } catch (e) {
          alert('Cancel gagal: ' + e.message);
        }
      }
    });
    calendar.render();
  }

  initCalendar();
})();
