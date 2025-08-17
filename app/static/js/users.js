let currentUsers = [];
let userToDelete = null;
let editingUser = null; // Track the user being edited

// Function to fetch and display users in a table
function showUsers(page = 1, perPage = 10) {
  fetch(`/admin/api/users?page=${page}&per_page=${perPage}`)
    .then(response => response.json()) // Parse the JSON response
    .then(users => {
      currentUsers = users;

      // Add User button and form at the top
      let html = `
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
        <div id="user-cards-container"></div>
      `;

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

      document.getElementById('tab-content').innerHTML = html;

      // Now render the user cards
      renderUserCards(users);
    });
}

async function renderUserCards(users) {
  let html = '';
  for (const user of users) {
    let discordInfo = await fetchDiscordUser(user.guild_id, user.user_id);
    let username = discordInfo && discordInfo.user ? discordInfo.user.username : 'Unknown';
    let avatarUrl = discordInfo && discordInfo.user && discordInfo.user.avatar
      ? discordInfo.user.avatar
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    const isEditing = editingUser &&
      editingUser.user_id === user.user_id &&
      editingUser.guild_id === user.guild_id;

    html += `
      <div class="user-card">
        <div class="user-card-row">
          <img src="${avatarUrl}" alt="Avatar" class="user-avatar">
          <div class="user-info">
            <div class="user-name">${username}</div>
            <div class="user-details">
              <span><strong>ID:</strong> ${user.user_id}</span>
              <span><strong>Date:</strong> ${
                isEditing
                  ? `<input type="date" id="edit-join-date-${user.user_id}-${user.guild_id}" value="${user.join_date}">`
                  : (user.join_date ? formatDateDMY(user.join_date) : '')
              }</span>
              <span><strong>Status:</strong> ${
                isEditing
                  ? `<select id="edit-status-${user.user_id}-${user.guild_id}">
                      <option value="active" ${user.status === 'active' ? 'selected' : ''}>active</option>
                      <option value="retired" ${user.status === 'retired' ? 'selected' : ''}>retired</option>
                    </select>`
                  : user.status
              }</span>
            </div>
          </div>
          <div class="user-actions">
            ${
              isEditing
                ? `<button onclick="saveUser('${user.user_id}', '${user.guild_id}')" class="save-btn" title="Save">
                     <span class="icon-check"></span>
                   </button>
                   <button onclick="cancelEditUser()" class="cancel-btn" title="Cancel">
                     <span class="icon-cancel"></span>
                   </button>`
                : `<button class="edit-btn" title="Edit" onclick="editUser('${user.user_id}', '${user.guild_id}')">
                     <span class="icon-gear"></span>
                   </button>
                   <button class="delete-btn" title="Delete" onclick="confirmDeleteUser('${user.user_id}', '${user.guild_id}')">
                     <span class="icon-x"></span>
                   </button>`
            }
          </div>
        </div>
      </div>
    `;
  }
  document.getElementById('user-cards-container').innerHTML = html;
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

function formatDateDMY(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

async function fetchDiscordUser(guildId, userId) {
  const res = await fetch(`/admin/api/discord_user/${guildId}/${userId}`);
  if (!res.ok) return null;
  return await res.json();
}