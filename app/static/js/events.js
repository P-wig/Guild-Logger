let currentEvents = [];
let eventToDelete = null;
let currentEventPage = 1;
let editModalEventId = null;
let currentAttendees = [];

// Function to fetch and display events
function showEvents(page = 1, perPage = 10) {
  fetch(`/admin/api/events?page=${page}&per_page=${perPage}`)
    .then(response => response.json())
    .then(events => {
      currentEvents = events;

      if (events.length === 0 && page > 1) {
        setEventPage(page - 1, perPage);
        return;
      }

      let html = `<div id="event-cards-container" style="padding: 20px 20px 0 20px; margin-top: 15px;"></div>`;

      html += `
        <div style="margin-top:20px; padding: 0 20px;">
          <button onclick="setEventPage(${page - 1}, ${perPage})" ${page <= 1 ? 'disabled' : ''}>Previous</button>
          <span style="margin:0 10px;">Page ${page}</span>
          <button onclick="setEventPage(${page + 1}, ${perPage})" ${events.length < perPage ? 'disabled' : ''}>Next</button>
        </div>
      `;

      if (eventToDelete) {
        html += `
          <div class="custom-modal-overlay">
            <div class="custom-modal">
              <p>Are you sure you want to delete this event?</p>
              <div class="custom-modal-actions">
                <button onclick="deleteEventConfirmed()"><span class="icon-x"></span> Yes, Delete</button>
                <button onclick="cancelDeleteEvent()" class="cancel-btn"><span class="icon-cancel"></span> Cancel</button>
              </div>
            </div>
          </div>
        `;
      }

      document.getElementById('tab-content').innerHTML = html;
      renderEventSearchBar();
      renderEventCards(events);
    });
}

function renderEventSearchBar() {
  document.getElementById('search-bar-container').innerHTML = `
    <div class="admin-search-row">
      <input type="text" id="search-event-host" placeholder="Search by Host ID">
      <button onclick="searchEvents()">Search</button>
      <button onclick="toggleAddEventForm()">Add</button>
    </div>
    <div id="add-event-form" style="display:none;margin-top:10px;">
      <input type="text" id="add-host-id" placeholder="Host ID (as string)">
      <input type="date" id="add-event-date" placeholder="Date">
      <input type="text" id="add-guild-id" placeholder="Guild ID (as string)">
      <button class="save-btn" onclick="addEvent()">Submit</button>
      <button class="cancel-btn" onclick="toggleAddEventForm()">Cancel</button>
    </div>
  `;
}

function renderSingleEventCard(event) {
  let html = `
    <div class="user-card" data-event-id="${event.event_id}">
      <div class="user-card-row">
        <div class="event-icon" style="width: 64px; height: 64px; border-radius: 50%; background: #7289da; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
          E
        </div>
        <div class="user-info">
          <div class="user-name">Event ${event.event_id}</div>
          <div class="user-details">
            <span><strong>Host ID:</strong> ${event.host_id}</span>
            <span><strong>Date:</strong> ${formatEventDateDMY(event.date)}</span>
            <span><strong>Guild ID:</strong> ${event.guild_id}</span>
          </div>
        </div>
        <div class="user-actions">
          <button class="edit-btn" title="Edit" onclick="openEditEventModal('${event.event_id}')">
            <span class="icon-gear"></span>
          </button>
          <button class="delete-btn" title="Delete" onclick="confirmDeleteEvent('${event.event_id}')">
            <span class="icon-x"></span>
          </button>
        </div>
      </div>
    </div>
  `;
  return html;
}

function renderEventCards(events) {
  let html = '';
  for (const event of events) {
    html += renderSingleEventCard(event);
  }
  document.getElementById('event-cards-container').innerHTML = html;
}

function searchEvents() {
  const hostId = document.getElementById('search-event-host').value.trim();
  fetch(`/admin/api/events?search=${encodeURIComponent(hostId)}`)
    .then(response => response.json())
    .then(events => {
      currentEvents = events;
      renderEventCards(events);
    });
}

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

function openEditEventModal(eventId) {
  editModalEventId = eventId;
  const event = currentEvents.find(e => e.event_id == eventId);
  
  // Fetch attendees first
  fetch(`/admin/api/events/${eventId}/attendees`)
    .then(res => res.json())
    .then(attendees => {
      currentAttendees = attendees.map(a => ({
        user_id: String(a.user_id)
      }));
      renderEditEventModal(event);
    });
}

function renderEditEventModal(event) {
  // Remove any existing modal
  document.querySelectorAll('.custom-modal-overlay.edit-modal').forEach(e => e.remove());

  if (!editModalEventId) return;

  let html = `
    <div class="custom-modal-overlay edit-modal">
      <div class="custom-modal" style="min-width: 500px;">
        <h3>Edit Event ${event.event_id}</h3>
        
        <!-- Event Details Section -->
        <div style="margin-bottom: 20px;">
          <h4>Event Details</h4>
          <div style="margin-bottom: 12px;">
            <label for="edit-host-id-modal"><strong>Host ID:</strong></label>
            <input type="text" id="edit-host-id-modal" value="${event.host_id}" style="width: 100%; margin-top: 5px;">
          </div>
          <div style="margin-bottom: 12px;">
            <label for="edit-date-modal"><strong>Date:</strong></label>
            <input type="date" id="edit-date-modal" value="${event.date ? event.date.substring(0, 10) : ''}" style="width: 100%; margin-top: 5px;">
          </div>
          <div style="margin-bottom: 12px;">
            <label for="edit-guild-id-modal"><strong>Guild ID:</strong></label>
            <input type="text" id="edit-guild-id-modal" value="${event.guild_id}" style="width: 100%; margin-top: 5px;">
          </div>
        </div>

        <!-- Attendees Section -->
        <div style="margin-bottom: 20px;">
          <h4>Attendees</h4>
          <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
            ${currentAttendees.length === 0 ? '<p>No attendees</p>' : ''}
            ${currentAttendees.map(a => `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span>${String(a.user_id)}</span>
                <button onclick="removeAttendeeFromModal('${String(a.user_id)}')" class="delete-btn" style="padding: 2px 6px;">Remove</button>
              </div>
            `).join('')}
          </div>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="add-attendee-user-id" placeholder="User ID to add" style="flex: 1;">
            <button onclick="addAttendeeFromModal()" class="save-btn">Add</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="custom-modal-actions">
          <button onclick="saveEventModal()" class="save-btn">
            <span class="icon-check"></span> Save Changes
          </button>
          <button onclick="closeEditEventModal()" class="cancel-btn">
            <span class="icon-cancel"></span> Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

function closeEditEventModal() {
  editModalEventId = null;
  currentAttendees = [];
  document.querySelectorAll('.custom-modal-overlay.edit-modal').forEach(e => e.remove());
}

function saveEventModal() {
  const hostId = document.getElementById('edit-host-id-modal').value.trim();
  const date = document.getElementById('edit-date-modal').value;
  const guildId = document.getElementById('edit-guild-id-modal').value.trim();

  if (!hostId || !guildId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    alert('Please fill all fields with valid data.');
    return;
  }

  fetch(`/admin/api/events/${editModalEventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host_id: hostId, date, guild_id: guildId })
  })
    .then(res => res.json())
    .then(() => {
      // Update the event in currentEvents
      const event = currentEvents.find(e => e.event_id == editModalEventId);
      if (event) {
        event.host_id = hostId;
        event.date = date;
        event.guild_id = guildId;
        
        // Re-render the card
        renderEventCards(currentEvents);
      }
      closeEditEventModal();
    });
}

function addAttendeeFromModal() {
  const userId = document.getElementById('add-attendee-user-id').value.trim();
  
  if (!userId) {
    alert('Please enter a user ID.');
    return;
  }

  fetch(`/admin/api/events/${editModalEventId}/attendees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Refresh the modal with updated attendees
        openEditEventModal(editModalEventId);
      } else {
        alert('Failed to add attendee: ' + (data.error || 'Unknown error'));
      }
    });
}

function removeAttendeeFromModal(userId) {
  fetch(`/admin/api/events/${editModalEventId}/attendees/${userId}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Refresh the modal with updated attendees
        openEditEventModal(editModalEventId);
      } else {
        alert('Failed to remove attendee: ' + (data.error || 'Unknown error'));
      }
    });
}

function confirmDeleteEvent(eventId) {
  eventToDelete = { event_id: eventId };
  showEvents(currentEventPage);
}

function cancelDeleteEvent() {
  eventToDelete = null;
  showEvents(currentEventPage);
}

function deleteEventConfirmed() {
  fetch(`/admin/api/events/${eventToDelete.event_id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      eventToDelete = null;
      showEvents(currentEventPage);
    });
}

function setEventPage(page, perPage) {
  currentEventPage = page;
  showEvents(currentEventPage, perPage);
}

function formatEventDateDMY(dateStr) {
  if (!dateStr) return '';
  const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    const [year, month, day] = match[0].split('-');
    return `${month}/${day}/${year}`;
  }
  return dateStr;
}