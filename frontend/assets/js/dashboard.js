(async () => {
  await requireAuth();
  const sum = await API.get('/dashboard/summary');
  document.getElementById('statSlots').innerText = sum.total_active_parking_slots;
  document.getElementById('statRemain').innerText = sum.parking_remaining_now;
  document.getElementById('statRooms').innerText = sum.total_meeting_rooms;
  document.getElementById('statMeetings').innerText = sum.today_meetings;
})();
