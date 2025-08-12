let currentUsers = [];
let userToDelete = null;
let editingUser = null; // Track the user being edited

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
        if (editingUser && editingUser.user_id === user.user_id && editingUser.guild_id === user.guild_id) {
          html += `
            <div class="user-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;box-shadow:2px 2px 8px #eee;">
              <strong>User ID:</strong> ${user.user_id}<br>
              <label>Join Date: <input type="date" id="edit-join-date-${user.user_id}-${user.guild_id}" value="${user.join_date ? user.join_date.substring(0, 10) : ''}"></label><br>
              <label>Status:
                <select id="edit-status-${user.user_id}-${user.guild_id}">
                  <option value="active" ${user.status === 'active' ? 'selected' : ''}>active</option>
                  <option value="retired" ${user.status === 'retired' ? 'selected' : ''}>retired</option>
                </select>
              </label><br>
              <button onclick="saveUser('${user.user_id}', '${user.guild_id}')">Save</button>
              <button onclick="cancelEditUser()">Cancel</button>
            </div>
          `;
        } else {
          html += `
            <div class="user-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;box-shadow:2px 2px 8px #eee;">
              <strong>User ID:</strong> ${user.user_id}<br>
              <strong>Join Date:</strong> ${user.join_date}<br>
              <strong>Status:</strong> ${user.status}<br>
              <button onclick="editUser('${user.user_id}', '${user.guild_id}')">Edit</button>
              <button onclick="confirmDeleteUser('${user.user_id}', '${user.guild_id}')">Delete</button>
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

      // Add User button and form
      html += `
        <div style="margin-bottom:20px;text-align:center;">
          <button onclick="toggleAddUserForm()">Add User</button>
          <div id="add-user-form" style="display:none;margin-top:10px;">
            <input type="text" id="add-user-id" placeholder="User ID (as string)">
            <input type="date" id="add-join-date" placeholder="Join Date">
            <select id="add-status">
              <option value="active">active</option>
              <option value="retired">retired</option>
            </select>
            <input type="text" id="add-guild-id" placeholder="Guild ID (as string)">
            <button onclick="addUser()">Submit</button>
            <button onclick="toggleAddUserForm()">Cancel</button>
          </div>
        </div>
      `;

      // Insert the generated HTML into the page
      document.getElementById('tab-content').innerHTML = html;
    });
}


function editUser(userId, guildId) {
  console.log("editUser called for", userId);
  editingUser = { user_id: userId, guild_id: guildId };
  showUsers();
}

function cancelEditUser() {
  console.log("cancelEditUser called");
  editingUser = null;
  showUsers();
}

function saveUser(userId, guildId) {
  const user = currentUsers.find(u => u.user_id == userId && u.guild_id == guildId);
  const joinDate = document.getElementById(`edit-join-date-${userId}-${guildId}`).value;
  const status = document.getElementById(`edit-status-${userId}-${guildId}`).value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinDate)) {
    alert('Please enter a valid date in YYYY-MM-DD format.');
    return;
  }
  const updatedUser = {
    ...user,
    join_date: joinDate,
    status: status
  };
  fetch(`/admin/api/users/${userId}/${guildId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedUser)
  })
    .then(res => res.json())
    .then(() => {
      console.log("saveUser completed for", userId);
      editingUser = null;
      showUsers();
    });
}

function confirmDeleteUser(userId, guildId) {
  userToDelete = { user_id: userId, guild_id: guildId };
  showUsers();
}

function cancelDeleteUser() {
  userToDelete = null;
  showUsers();
}

function deleteUserConfirmed() {
  fetch(`/admin/api/users/${userToDelete.user_id}/${userToDelete.guild_id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      userToDelete = null;
      showUsers();
    });
}

// Toggle Add User form visibility
function toggleAddUserForm() {
  const form = document.getElementById('add-user-form');
  if (form.style.display === 'none') {
    form.style.display = 'block';
  } else {
    form.style.display = 'none';
  }
}

// Add a new user
function addUser() {
  const userId = document.getElementById('add-user-id').value.trim();
  const joinDate = document.getElementById('add-join-date').value;
  const status = document.getElementById('add-status').value;
  const guildId = document.getElementById('add-guild-id').value.trim();

  if (!/^\d{17,20}$/.test(userId)) {
    alert('Please enter a valid Discord User ID (as a string of digits).');
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinDate)) {
    alert('Please enter a valid join date in YYYY-MM-DD format.');
    return;
  }
  if (!['active', 'retired'].includes(status)) {
    alert('Invalid status.');
    return;
  }
  if (currentUsers.some(u => u.user_id === userId && u.guild_id === guildId)) {
    alert('A user with this ID and guild already exists.');
    return;
  }
  if (!/^\d{17,20}$/.test(guildId)) {
    alert('Please enter a valid Guild ID.');
    return;
  }

  fetch('/admin/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      guild_id: guildId,
      join_date: joinDate,
      status: status
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        toggleAddUserForm();
        showUsers();
      } else {
        alert('Failed to add user: ' + (data.error || 'Unknown error'));
      }
    });
}