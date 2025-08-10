// Function to fetch and display events in a table
function showEvents(page = 1, perPage = 10) {
  fetch(`/admin/api/events?page=${page}&per_page=${perPage}`)
    .then(response => response.json())
    .then(events => {
      let html = '<div class="event-cards" style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;">';
      events.forEach(event => {
        html += `
          <div class="event-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;">
            <strong>Event ID:</strong> ${event.event_id}<br>
            <strong>Host ID:</strong> ${event.host_id}<br>
            <button onclick="showEventAttendees(${event.event_id}, this)">Show Attendees</button>
            <div class="attendees-list" id="attendees-${event.event_id}" style="margin-top:10px; display:none;"></div>
          </div>
        `;
      });
      html += '</div>';
      // Pagination controls
      html += `
        <div style="margin-top:20px;">
          <button onclick="showEvents(${page - 1}, ${perPage})" ${page <= 1 ? 'disabled' : ''}>Previous</button>
          <span style="margin:0 10px;">Page ${page}</span>
          <button onclick="showEvents(${page + 1}, ${perPage})" ${events.length < perPage ? 'disabled' : ''}>Next</button>
        </div>
      `;
      document.getElementById('tab-content').innerHTML = html;
    });
}

// Add this function to fetch and display attendees for an event
function showEventAttendees(eventId, btn) {
  const attendeesDiv = document.getElementById(`attendees-${eventId}`);
  if (attendeesDiv.style.display === "none") {
    fetch(`/admin/api/events/${eventId}/attendees`)
      .then(response => response.json())
      .then(attendees => {
        if (attendees.length === 0) {
          attendeesDiv.innerHTML = "<em>No attendees found.</em>";
        } else {
          attendeesDiv.innerHTML = attendees.map(a =>
            `<div style="border-bottom:1px solid #eee;padding:4px 0;">
              <strong>User ID:</strong> ${a.user_id}<br>
            </div>`
          ).join('');
        }
        attendeesDiv.style.display = "block";
        btn.textContent = "Hide Attendees";
      });
  } else {
    attendeesDiv.style.display = "none";
    btn.textContent = "Show Attendees";
  }
}