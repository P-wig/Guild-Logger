let currentUsers = [];
let userToDelete = null;
let editingUser = null; // Track the user being edited
let currentPage = 1;


async function getUserCardData(userId, guildId) {
  const user = currentUsers.find(u => u.user_id === userId && u.guild_id === guildId);
  const discordInfo = await fetchDiscordUser(user.guild_id, user.user_id);
  const username = discordInfo && discordInfo.user ? discordInfo.user.username : 'Unknown';
  const avatarUrl = discordInfo && discordInfo.user && discordInfo.user.avatar
    ? discordInfo.user.avatar
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
  return { user, username, avatarUrl };
}

function renderSingleUserCard(user, isEditing, username, avatarUrl) {
  let html = `
    <div class="user-card" data-user-id="${user.user_id}" data-guild-id="${user.guild_id}">
      <div class="user-card-row">
        <img src="${avatarUrl}" alt="Avatar" class="user-avatar">
        <div class="user-info">
          <div class="user-name">${username}</div>
          <div class="user-details">
            <span><strong>ID:</strong> ${user.user_id}</span>
            <span><strong>Date:</strong> ${
              isEditing
                ? `<input type="date" id="edit-join-date-${user.user_id}-${user.guild_id}" value="${user.join_date}">`
                : formatUserDateDMY(user.join_date)
            }</span>
            <span><strong>Status:</strong> ${
              isEditing
                ? `<select id="edit-status-${user.user_id}-${user.guild_id}">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>active</option>
                    <option value="retired" ${user.status === 'retired' ? 'selected' : ''}>retired</option>
                  </select>`
                : user.status
            }</span>
            <span><strong>Consecutive Main Events Missed:</strong> ${user.consecutive_main_events_missed ?? 0}</span>
            <span><strong>Total Events Hosted:</strong> ${user.total_events_hosted ?? 0}</span>
            <span><strong>Total Events Attended:</strong> ${user.total_events_attended ?? 0}</span>
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
  return html;
}

async function renderUserCards(users) {
  let html = '';
  for (const user of users) {
    const isEditing = editingUser &&
      editingUser.user_id === user.user_id &&
      editingUser.guild_id === user.guild_id;

    // Use the DRY helper for all card data
    const { user: cardUser, username, avatarUrl } = await getUserCardData(user.user_id, user.guild_id);

    html += renderSingleUserCard(cardUser, isEditing, username, avatarUrl);
  }
  document.getElementById('user-cards-container').innerHTML = html;
}

// Function to fetch and display users in a table
function showUsers(page = 1, perPage = 10, guildId = window.selectedGuildId) {
  let url = `/admin/api/users?page=${page}&per_page=${perPage}`;
  if (guildId) url += `&guild_id=${guildId}`;
  fetch(url)
    .then(response => response.json())
    .then(users => {
      currentUsers = users;

      // If no users and not on the first page, go back one page
      if (users.length === 0 && page > 1) {
        setPage(page - 1, perPage);
        return;
      }

      // Only render the user cards container and pagination controls
      let html = `<div id="user-cards-container"></div>`;

      html += `
        <div style="margin-top:20px;">
          <button onclick="setPage(${page - 1}, ${perPage})" ${page <= 1 ? 'disabled' : ''}>Previous</button>
          <span style="margin:0 10px;">Page ${page}</span>
          <button onclick="setPage(${page + 1}, ${perPage})" ${(users.length < perPage) ? 'disabled' : ''}>Next</button>
        </div>
      `;

      // Modal
      if (userToDelete) {
        html += `
          <div class="custom-modal-overlay">
            <div class="custom-modal">
              <p>Are you sure you want to delete this user?</p>
              <div class="custom-modal-actions">
                <button onclick="deleteUserConfirmed()"><span class="icon-x"></span> Yes, Delete</button>
                <button onclick="cancelDeleteUser()" class="cancel-btn"><span class="icon-cancel"></span> Cancel</button>
              </div>
            </div>
          </div>
        `;
      }

      document.getElementById('tab-content').innerHTML = html;

      // Render the search bar (if not already rendered)
      renderUserSearchBar();

      // Now render the user cards
      renderUserCards(users);
    });
}

async function editUser(userId, guildId) {
  const user = currentUsers.find(u => u.user_id === userId && u.guild_id === guildId);
  if (user) {
    openEditUserModal(user);
  }
}

async function cancelEditUser() {
  if (editingUser) {
    const { user_id, guild_id } = editingUser;
    editingUser = null;
    const card = document.querySelector(
      `.user-card[data-user-id="${user_id}"][data-guild-id="${guild_id}"]`
    );
    if (card) {
      const { user, username, avatarUrl } = await getUserCardData(user_id, guild_id);
      card.outerHTML = renderSingleUserCard(user, false, username, avatarUrl);
    }
  }
}

async function saveUserModal(userId, guildId) {
  const user = currentUsers.find(u => u.user_id == userId && u.guild_id == guildId);
  const joinDate = document.getElementById('edit-join-date-modal').value;
  const status = document.getElementById('edit-status-modal').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinDate)) {
    alert('Please enter a valid date in YYYY-MM-DD format.');
    return;
  }
  const updatedUser = {
    ...user,
    join_date: joinDate,
    status: status
  };
  const res = await fetch(`/admin/api/users/${userId}/${guildId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedUser)
  });
  await res.json();
  closeEditUserModal();

  // Update the user in currentUsers
  Object.assign(user, updatedUser);

  // Get updated Discord info
  const { user: cardUser, username, avatarUrl } = await getUserCardData(userId, guildId);

  // Replace only the updated card in the DOM
  const card = document.querySelector(`.user-card[data-user-id="${userId}"][data-guild-id="${guildId}"]`);
  if (card) {
    card.outerHTML = renderSingleUserCard(cardUser, false, username, avatarUrl);
  }
}

function confirmDeleteUser(userId, guildId) {
  userToDelete = { user_id: userId, guild_id: guildId };
  showUsers(currentPage);
}

function cancelDeleteUser() {
  userToDelete = null;
  showUsers(currentPage);
}

function deleteUserConfirmed() {
  fetch(`/admin/api/users/${userToDelete.user_id}/${userToDelete.guild_id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      userToDelete = null;
      showUsers(currentPage);
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

function formatUserDateDMY(dateStr) {
  console.log('Raw date:', dateStr);
  if (!dateStr) return '';
  // Extract YYYY-MM-DD from any string
  const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    const [year, month, day] = match[0].split('-');
    console.log('Formatted date:', `${month}/${day}/${year}`);
    return `${month}/${day}/${year}`;
  }
  return dateStr; // fallback
}

async function fetchDiscordUser(guildId, userId) {
  const res = await fetch(`/admin/api/discord_user/${guildId}/${userId}`);
  if (!res.ok) return null;
  return await res.json();
}

function searchUsers() {
  const userId = document.getElementById('search-user-id').value.trim();
  fetch(`/admin/api/users?search=${encodeURIComponent(userId)}`)
    .then(response => response.json())
    .then(users => {
      currentUsers = users;
      renderUserCards(users);
    });
}

function setPage(page, perPage) {
  currentPage = page;
  showUsers(currentPage, perPage);
}

function renderUserSearchBar() {
  document.getElementById('search-bar-container').innerHTML = `
    <div class="admin-search-row">
      <input type="text" id="search-user-id" placeholder="Search User ID">
      <button onclick="searchUsers()">Search</button>
      <button onclick="toggleAddUserForm()">Add User</button>
    </div>
    <div id="add-user-form" style="display:none;margin-top:10px;">
      <input type="text" id="add-user-id" placeholder="User ID (as string)">
      <input type="date" id="add-join-date" placeholder="Join Date">
      <select id="add-status">
        <option value="active">active</option>
        <option value="retired">retired</option>
      </select>
      <input type="text" id="add-guild-id" placeholder="Guild ID (as string)">
      <button class="save-btn" onclick="addUser()">Submit</button>
      <button class="cancel-btn" onclick="toggleAddUserForm()">Cancel</button>
    </div>
  `;
}

async function openEditUserModal(user) {
  // Remove any existing modal
  const oldModal = document.querySelector('.custom-modal-overlay.edit-modal');
  if (oldModal) oldModal.remove();

  // Use your helper to get all card data
  const { user: cardUser, username, avatarUrl } = await getUserCardData(user.user_id, user.guild_id);

  const modalHtml = `
    <div class="custom-modal-overlay edit-modal">
      <div class="custom-modal">
        <h3>Edit User</h3>
        <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
          <img src="${avatarUrl}" alt="Avatar" class="user-avatar" style="width:64px;height:64px;border-radius:50%;border:2px solid #7289da;">
          <div>
            <div class="user-name" style="font-size:1.2em;font-weight:bold;">${username}</div>
            <div><strong>ID:</strong> ${cardUser.user_id}</div>
          </div>
        </div>
        <div style="margin-bottom:12px;">
          <label for="edit-join-date-modal"><strong>Join Date:</strong></label>
          <input type="date" id="edit-join-date-modal" value="${cardUser.join_date}">
        </div>
        <div style="margin-bottom:12px;">
          <label for="edit-status-modal"><strong>Status:</strong></label>
          <select id="edit-status-modal">
            <option value="active" ${cardUser.status === 'active' ? 'selected' : ''}>active</option>
            <option value="retired" ${cardUser.status === 'retired' ? 'selected' : ''}>retired</option>
          </select>
        </div>
        <div class="custom-modal-actions">
          <button onclick="saveUserModal('${cardUser.user_id}', '${cardUser.guild_id}')" class="save-btn">
            <span class="icon-check"></span> Save
          </button>
          <button onclick="closeEditUserModal()" class="cancel-btn">
            <span class="icon-cancel"></span> Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeEditUserModal() {
  const modal = document.querySelector('.custom-modal-overlay.edit-modal');
  if (modal) modal.remove();
}