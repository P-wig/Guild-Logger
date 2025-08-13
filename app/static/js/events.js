let currentEvents = [];
let editingEvent = null; // { event_id }
let eventToDelete = null; // { event_id }
let attendeesModalEventId = null;
let currentAttendees = [];

// Function to fetch and display events in a table
function showEvents(page = 1, perPage = 10) {
  fetch(`/admin/api/events?page=${page}&per_page=${perPage}`)
    .then(response => response.json())
    .then(events => {
      let html = '<div class="event-cards" style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;">';
      events.forEach(event => {
        if (editingEvent && editingEvent.event_id === event.event_id) {
          html += `
            <div class="event-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;">
              <label>Event ID: <span>${event.event_id}</span></label><br>
              <label>Host ID: <input type="text" id="edit-host-id-${event.event_id}" value="${event.host_id}"></label><br>
              <label>Date: <input type="date" id="edit-date-${event.event_id}" value="${event.date ? event.date.substring(0, 10) : ''}"></label><br>
              <label>Guild ID: <input type="text" id="edit-guild-id-${event.event_id}" value="${event.guild_id}"></label><br>
              <button onclick="saveEvent('${event.event_id}')">Save</button>
              <button onclick="cancelEditEvent()">Cancel</button>
            </div>
          `;
        } else {
          html += `
            <div class="event-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;">
              <strong>Event ID:</strong> ${event.event_id}<br>
              <strong>Host ID:</strong> ${event.host_id}<br>
              <strong>Date:</strong> ${event.date}<br>
              <strong>Guild ID:</strong> ${event.guild_id}<br>
              <button onclick="editEvent('${event.event_id}')">Edit</button>
              <button onclick="confirmDeleteEvent('${event.event_id}')">Delete</button>
              <button onclick="openAttendeesModal('${event.event_id}')">Manage Attendees</button>
            </div>
          `;
        }
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
      // Add Event button and form
      html += `
        <div style="margin-bottom:20px;text-align:center;">
          <button onclick="toggleAddEventForm()">Add Event</button>
          <div id="add-event-form" style="display:none;margin-top:10px;">
            <input type="text" id="add-host-id" placeholder="Host ID (as string)">
            <input type="date" id="add-event-date" placeholder="Date">
            <input type="text" id="add-guild-id" placeholder="Guild ID (as string)">
            <button onclick="addEvent()">Submit</button>
            <button onclick="toggleAddEventForm()">Cancel</button>
          </div>
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

// Function to toggle the display of the event addition form
function toggleAddEventForm() {
  const form = document.getElementById('add-event-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function addEvent() {
  const hostId = document.getElementById('add-host-id').value.trim();
  const date = document.getElementById('add-event-date').value;
  const guildId = document.getElementById('add-guild-id').value.trim();

  if (!hostId || !guildId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    alert('Please fill all fields with valid data.');
    return;
  }

  fetch('/admin/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host_id: hostId, date, guild_id: guildId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        toggleAddEventForm();
        showEvents();
      } else {
        alert('Failed to add event: ' + (data.error || 'Unknown error'));
      }
    });
}

function editEvent(eventId) {
  editingEvent = { event_id: eventId };
  showEvents();
}

function cancelEditEvent() {
  editingEvent = null;
  showEvents();
}

function saveEvent(eventId) {
  const event = currentEvents.find(e => e.event_id === eventId);
  const hostId = document.getElementById(`edit-host-id-${eventId}`).value.trim();
  const date = document.getElementById(`edit-date-${eventId}`).value;
  const guildId = document.getElementById(`edit-guild-id-${eventId}`).value.trim();

  if (!hostId || !guildId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    alert('Please fill all fields with valid data.');
    return;
  }

  fetch(`/admin/api/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host_id: hostId, date, guild_id: guildId })
  })
    .then(res => res.json())
    .then(() => {
      editingEvent = null;
      showEvents();
    });
}

function confirmDeleteEvent(eventId) {
  eventToDelete = { event_id: eventId };
  showEvents();
}

function cancelDeleteEvent() {
  eventToDelete = null;
  showEvents();
}

function deleteEventConfirmed() {
  fetch(`/admin/api/events/${eventToDelete.event_id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      eventToDelete = null;
      showEvents();
    });
}

function openAttendeesModal(eventId) {
  attendeesModalEventId = eventId;
  fetch(`/admin/api/events/${eventId}/attendees`)
    .then(res => res.json())
    .then(attendees => {
      // Ensure all user_ids are strings
      currentAttendees = attendees.map(a => ({
        user_id: String(a.user_id)
      }));
      renderAttendeesModal();
    });
}

function closeAttendeesModal() {
  attendeesModalEventId = null;
  currentAttendees = [];
  // Remove modal from DOM
  document.querySelectorAll('.modal-overlay').forEach(e => e.remove());
}

function renderAttendeesModal() {
  // Remove any existing modal first
  document.querySelectorAll('.modal-overlay').forEach(e => e.remove());

  if (!attendeesModalEventId) return;

  let html = `
    <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:1000;">
      <div class="modal" style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 2px 8px #0002;min-width:300px;">
        <h3>Attendees for Event ${attendeesModalEventId}</h3>
        <ul style="list-style:none;padding:0;">
          ${currentAttendees.map(a => `
            <li style="margin-bottom:8px;">
              <span>${String(a.user_id)}</span>
              <button onclick="removeAttendee('${String(a.user_id)}')">Remove</button>
            </li>
          `).join('')}
        </ul>
        <input type="text" id="add-attendee-user-id" placeholder="User ID to add">
        <button onclick="addAttendee()">Add Attendee</button>
        <button onclick="closeAttendeesModal()">Close</button>
      </div>
    </div>
  `;
  // Append modal to body
  document.body.insertAdjacentHTML('beforeend', html);
}

function addAttendee() {
  const userId = document.getElementById('add-attendee-user-id').value.trim();

  // Already a string, do NOT use parseInt or Number()
  
  fetch(`/admin/api/events/${attendeesModalEventId}/attendees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Refresh attendee list
        openAttendeesModal(attendeesModalEventId);
      } else {
        alert('Failed to add attendee: ' + (data.error || 'Unknown error'));
      }
    });
}

function removeAttendee(userId) {
  fetch(`/admin/api/events/${attendeesModalEventId}/attendees/${userId}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Refresh attendee list
        openAttendeesModal(attendeesModalEventId);
      } else {
        alert('Failed to remove attendee: ' + (data.error || 'Unknown error'));
      }
    });
}