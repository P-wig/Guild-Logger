// Function to fetch and display users in a table
function showUsers(page = 1, perPage = 10) {
  // Make a GET request to the /api/users endpoint with pagination
  fetch(`/admin/api/users?page=${page}&per_page=${perPage}`)
    .then(response => response.json()) // Parse the JSON response
    .then(users => {
      currentUsers = users;
      // Start building the HTML for the user cards
      let html = '<div class="user-cards" style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;">';
      // Add a card for each user
      users.forEach(user => {
        if (editingUserId === user.user_id) {
          html += `
            <div class="user-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;box-shadow:2px 2px 8px #eee;">
              <strong>User ID:</strong> ${user.user_id}<br>
              <label>Join Date: <input type="date" id="edit-join-date-${user.user_id}" value="${user.join_date ? user.join_date.substring(0, 10) : ''}"></label><br>
              <label>Status:
                <select id="edit-status-${user.user_id}">
                  <option value="active" ${user.status === 'active' ? 'selected' : ''}>active</option>
                  <option value="retired" ${user.status === 'retired' ? 'selected' : ''}>retired</option>
                </select>
              </label><br>
              <button onclick="saveUser('${user.user_id}')">Save</button>
              <button onclick="cancelEditUser()">Cancel</button>
            </div>
          `;
        } else {
          html += `
            <div class="user-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;box-shadow:2px 2px 8px #eee;">
              <strong>User ID:</strong> ${user.user_id}<br>
              <strong>Join Date:</strong> ${user.join_date}<br>
              <strong>Status:</strong> ${user.status}<br>
              <button onclick="editUser('${user.user_id}')">Edit</button>
              <button onclick="confirmDeleteUser('${user.user_id}')">Delete</button>
            </div>
          `;
        }
      });
      html += '</div>';
      // Pagination controls
      html += `
        <div style="margin-top:20px;">
          <button onclick="showUsers(${page - 1}, ${perPage})" ${page <= 1 ? 'disabled' : ''}>Previous</button>
          <span style="margin:0 10px;">Page ${page}</span>
          <button onclick="showUsers(${page + 1}, ${perPage})" ${users.length < perPage ? 'disabled' : ''}>Next</button>
        </div>
      `;

      // Modal
      if (userToDelete) {
        html += `
          <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="modal" style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 2px 8px #0002;">
              <p>Are you sure you want to delete this user?</p>
              <button onclick="deleteUserConfirmed()">Yes, Delete</button>
              <button onclick="cancelDeleteUser()">Cancel</button>
            </div>
          </div>
        `;
      }

      // Insert the generated HTML into the page
      document.getElementById('tab-content').innerHTML = html;
    });
}

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

function showFormerUsers(page = 1, perPage = 10) {
  fetch(`/admin/api/former_users?page=${page}&per_page=${perPage}`)
    .then(response => response.json())
    .then(users => {
      let html = '<div class="former-user-cards" style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;">';
      users.forEach(user => {
        html += `
          <div class="former-user-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;">
            <strong>User ID:</strong> ${user.user_id}<br>
            <strong>Left Date:</strong> ${user.left_date}<br>
          </div>
        `;
      });
      html += '</div>';
      // Pagination controls
      html += `
        <div style="margin-top:20px;">
          <button onclick="showFormerUsers(${page - 1}, ${perPage})" ${page <= 1 ? 'disabled' : ''}>Previous</button>
          <span style="margin:0 10px;">Page ${page}</span>
          <button onclick="showFormerUsers(${page + 1}, ${perPage})" ${users.length < perPage ? 'disabled' : ''}>Next</button>
        </div>
      `;
      document.getElementById('tab-content').innerHTML = html;
    });
}


let currentUsers = [];
let editingUserId = null;
let userToDelete = null;

function editUser(userId) {
  console.log("editUser called for", userId);
  editingUserId = userId;
  showUsers();
}

function cancelEditUser() {
  console.log("cancelEditUser called");
  editingUserId = null;
  showUsers();
}

function saveUser(userId) {
  console.log("saveUser called for", userId);
  const user = currentUsers.find(u => u.user_id == userId);
  const joinDate = document.getElementById(`edit-join-date-${userId}`).value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinDate)) {
    alert('Please enter a valid date in YYYY-MM-DD format.');
    return;
  }
  const status = document.getElementById(`edit-status-${userId}`).value;
  const updatedUser = {
    ...user,
    join_date: joinDate,
    status: status
  };
  fetch(`/admin/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedUser)
  })
    .then(res => res.json())
    .then(() => {
      console.log("saveUser completed for", userId);
      editingUserId = null;
      showUsers();
    });
}

function confirmDeleteUser(userId) {
  userToDelete = userId;
  showUsers();
}

function cancelDeleteUser() {
  userToDelete = null;
  showUsers();
}

function deleteUserConfirmed() {
  fetch(`/admin/api/users/${userToDelete}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      userToDelete = null;
      showUsers();
    });
}