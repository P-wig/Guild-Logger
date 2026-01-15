let currentFormerUsers = [];
let formerUserToDelete = null;
let editingFormerUser = null;
let currentFormerUserPage = 1;

async function getFormerUserCardData(userId, guildId) {
  const user = currentFormerUsers.find(u => u.user_id === userId && u.guild_id === guildId);
  const discordInfo = await fetchDiscordUser(guildId, userId);
  const username = discordInfo && discordInfo.user ? discordInfo.user.username : 'Unknown';
  const avatarUrl = discordInfo && discordInfo.user && discordInfo.user.avatar
    ? discordInfo.user.avatar
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
  return { user, username, avatarUrl };
}

function renderSingleFormerUserCard(user, isEditing, username, avatarUrl) {
  let html = `
    <div class="user-card" data-user-id="${user.user_id}" data-guild-id="${user.guild_id}">
      <div class="user-card-row">
        <img src="${avatarUrl}" alt="Avatar" class="user-avatar">
        <div class="user-info">
          <div class="user-name">${username}</div>
          <div class="user-details">
            <span><strong>ID:</strong> ${user.user_id}</span>
            <span><strong>Guild ID:</strong> ${user.guild_id}</span>
            <span><strong>Left Date:</strong> ${
              isEditing
                ? `<input type="date" id="edit-left-date-${user.user_id}-${user.guild_id}" value="${user.left_date}">`
                : formatFormerUserDateDMY(user.left_date)
            }</span>
          </div>
        </div>
        <div class="user-actions">
          ${
            isEditing
              ? `<button onclick="saveFormerUser('${user.user_id}', '${user.guild_id}')" class="save-btn" title="Save">
                   <span class="icon-check"></span>
                 </button>
                 <button onclick="cancelEditFormerUser()" class="cancel-btn" title="Cancel">
                   <span class="icon-cancel"></span>
                 </button>`
              : `<button class="edit-btn" title="Edit" onclick="editFormerUser('${user.user_id}', '${user.guild_id}')">
                   <span class="icon-gear"></span>
                 </button>
                 <button class="delete-btn" title="Delete" onclick="confirmDeleteFormerUser('${user.user_id}', '${user.guild_id}')">
                   <span class="icon-x"></span>
                 </button>`
          }
        </div>
      </div>
    </div>
  `;
  return html;
}

async function renderFormerUserCards(users) {
  let html = '';
  for (const user of users) {
    const isEditing = editingFormerUser &&
      editingFormerUser.user_id === user.user_id &&
      editingFormerUser.guild_id === user.guild_id;

    const { user: cardUser, username, avatarUrl } = await getFormerUserCardData(user.user_id, user.guild_id);
    html += renderSingleFormerUserCard(cardUser, isEditing, username, avatarUrl);
  }
  document.getElementById('former-user-cards-container').innerHTML = html;
}

function showFormerUsers(page = 1, perPage = 10, guildId = window.selectedGuildId) {
  let url = `/admin/api/former_users?page=${page}&per_page=${perPage}`;
  if (guildId) url += `&guild_id=${guildId}`;
  
  fetch(url)
    .then(response => response.json())
    .then(users => {
      currentFormerUsers = users;

      if (users.length === 0 && page > 1) {
        setFormerUserPage(page - 1, perPage);
        return;
      }

      let html = `<div id="former-user-cards-container" style="padding: 20px 20px 0 20px; margin-top: 15px;"></div>`;

      html += `
        <div style="margin-top:20px; padding: 0 20px;">
          <button onclick="setFormerUserPage(${page - 1}, ${perPage})" ${page <= 1 ? 'disabled' : ''}>Previous</button>
          <span style="margin:0 10px;">Page ${page}</span>
          <button onclick="setFormerUserPage(${page + 1}, ${perPage})" ${(users.length < perPage) ? 'disabled' : ''}>Next</button>
        </div>
      `;

      if (formerUserToDelete) {
        html += `
          <div class="custom-modal-overlay">
            <div class="custom-modal">
              <p>Are you sure you want to delete this former user?</p>
              <div class="custom-modal-actions">
                <button onclick="deleteFormerUserConfirmed()"><span class="icon-x"></span> Yes, Delete</button>
                <button onclick="cancelDeleteFormerUser()" class="cancel-btn"><span class="icon-cancel"></span> Cancel</button>
              </div>
            </div>
          </div>
        `;
      }

      document.getElementById('tab-content').innerHTML = html;
      renderFormerUserSearchBar();
      renderFormerUserCards(users);
    });
}

async function editFormerUser(userId, guildId) {
  const user = currentFormerUsers.find(u => u.user_id === userId && u.guild_id === guildId);
  if (user) {
    openEditFormerUserModal(user);
  }
}

async function cancelEditFormerUser() {
  if (editingFormerUser) {
    const { user_id, guild_id } = editingFormerUser;
    editingFormerUser = null;
    const card = document.querySelector(
      `.user-card[data-user-id="${user_id}"][data-guild-id="${guild_id}"]`
    );
    if (card) {
      const { user, username, avatarUrl } = await getFormerUserCardData(user_id, guild_id);
      card.outerHTML = renderSingleFormerUserCard(user, false, username, avatarUrl);
    }
  }
}

async function saveFormerUserModal(userId, guildId) {
  const user = currentFormerUsers.find(u => u.user_id == userId && u.guild_id == guildId);
  const leftDate = document.getElementById('edit-left-date-modal').value;
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(leftDate)) {
    alert('Please enter a valid date in YYYY-MM-DD format.');
    return;
  }

  const updatedUser = {
    ...user,
    left_date: leftDate
  };

  const res = await fetch(`/admin/api/former_users/${userId}/${guildId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedUser)
  });
  await res.json();
  closeEditFormerUserModal();

  Object.assign(user, updatedUser);
  const { user: cardUser, username, avatarUrl } = await getFormerUserCardData(userId, guildId);
  const card = document.querySelector(`.user-card[data-user-id="${userId}"][data-guild-id="${guildId}"]`);
  if (card) {
    card.outerHTML = renderSingleFormerUserCard(cardUser, false, username, avatarUrl);
  }
}

function confirmDeleteFormerUser(userId, guildId) {
  formerUserToDelete = { user_id: userId, guild_id: guildId };
  showFormerUsers(currentFormerUserPage);
}

function cancelDeleteFormerUser() {
  formerUserToDelete = null;
  showFormerUsers(currentFormerUserPage);
}

function deleteFormerUserConfirmed() {
  fetch(`/admin/api/former_users/${formerUserToDelete.user_id}/${formerUserToDelete.guild_id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      formerUserToDelete = null;
      showFormerUsers(currentFormerUserPage);
    });
}

function toggleAddFormerUserForm() {
  const form = document.getElementById('add-former-user-form');
  if (form.style.display === 'none') {
    form.style.display = 'block';
  } else {
    form.style.display = 'none';
  }
}

function addFormerUser() {
  const userId = document.getElementById('add-former-user-id').value.trim();
  const guildId = document.getElementById('add-former-guild-id').value.trim();
  const leftDate = document.getElementById('add-left-date').value;

  if (!/^\d{17,20}$/.test(userId)) {
    alert('Please enter a valid Discord User ID (as a string of digits).');
    return;
  }
  if (!/^\d{17,20}$/.test(guildId)) {
    alert('Please enter a valid Guild ID (as a string of digits).');
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(leftDate)) {
    alert('Please enter a valid left date in YYYY-MM-DD format.');
    return;
  }
  if (currentFormerUsers.some(u => u.user_id === userId && u.guild_id === guildId)) {
    alert('A former user with this ID and guild already exists.');
    return;
  }

  fetch('/admin/api/former_users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      guild_id: guildId,
      left_date: leftDate
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        toggleAddFormerUserForm();
        showFormerUsers();
      } else {
        alert('Failed to add former user: ' + (data.error || 'Unknown error'));
      }
    });
}

function searchFormerUsers() {
  const userId = document.getElementById('search-former-user-id').value.trim();
  fetch(`/admin/api/former_users?search=${encodeURIComponent(userId)}`)
    .then(response => response.json())
    .then(users => {
      currentFormerUsers = users;
      renderFormerUserCards(users);
    });
}

function setFormerUserPage(page, perPage) {
  currentFormerUserPage = page;
  showFormerUsers(currentFormerUserPage, perPage);
}

function renderFormerUserSearchBar() {
  document.getElementById('search-bar-container').innerHTML = `
    <div class="admin-search-row">
      <input type="text" id="search-user-id" placeholder="Search User ID">
      <button onclick="searchFormerUsers()">Search</button>
      <button onclick="toggleAddFormerUserForm()">Add</button>
    </div>
    <div id="add-former-user-form" style="display:none;margin-top:10px;">
      <input type="text" id="add-former-user-id" placeholder="User ID (as string)">
      <input type="text" id="add-former-guild-id" placeholder="Guild ID (as string)">
      <input type="date" id="add-left-date" placeholder="Left Date">
      <button class="save-btn" onclick="addFormerUser()">Submit</button>
      <button class="cancel-btn" onclick="toggleAddFormerUserForm()">Cancel</button>
    </div>
  `;
}

async function openEditFormerUserModal(user) {
  const oldModal = document.querySelector('.custom-modal-overlay.edit-modal');
  if (oldModal) oldModal.remove();

  const { user: cardUser, username, avatarUrl } = await getFormerUserCardData(user.user_id, user.guild_id);

  const modalHtml = `
    <div class="custom-modal-overlay edit-modal">
      <div class="custom-modal">
        <h3>Edit Former User</h3>
        <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
          <img src="${avatarUrl}" alt="Avatar" class="user-avatar" style="width:64px;height:64px;border-radius:50%;border:2px solid #7289da;">
          <div>
            <div class="user-name" style="font-size:1.2em;font-weight:bold;">${username}</div>
            <div><strong>ID:</strong> ${cardUser.user_id}</div>
          </div>
        </div>
        <div style="margin-bottom:12px;">
          <label for="edit-left-date-modal"><strong>Left Date:</strong></label>
          <input type="date" id="edit-left-date-modal" value="${cardUser.left_date}">
        </div>
        <div class="custom-modal-actions">
          <button onclick="saveFormerUserModal('${cardUser.user_id}', '${cardUser.guild_id}')" class="save-btn">
            <span class="icon-check"></span> Save
          </button>
          <button onclick="closeEditFormerUserModal()" class="cancel-btn">
            <span class="icon-cancel"></span> Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeEditFormerUserModal() {
  const modal = document.querySelector('.custom-modal-overlay.edit-modal');
  if (modal) modal.remove();
}

function formatFormerUserDateDMY(dateStr) {
  if (!dateStr) return '';
  const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    const [year, month, day] = match[0].split('-');
    return `${month}/${day}/${year}`;
  }
  return dateStr;
}

async function fetchDiscordUser(guildId, userId) {
  const res = await fetch(`/admin/api/discord_user/${guildId}/${userId}`);
  if (!res.ok) return null;
  return await res.json();
}