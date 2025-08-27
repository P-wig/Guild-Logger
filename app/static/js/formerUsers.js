let currentFormerUsers = [];
let deletingFormerUser = null;

// Fetch and display former users
function showFormerUsers(page = 1, perPage = 10) {
  fetch(`/admin/api/former_users?page=${page}&per_page=${perPage}`)
    .then(response => response.json())
    .then(users => {
      currentFormerUsers = users;

      // Add Former User button and form at the top (already present)
      let html = `
        <div style="margin-bottom:20px;text-align:center;">
          <button onclick="toggleAddFormerUserForm()">Add Former User</button>
          <div id="add-former-user-form" style="display:none;margin-top:10px;">
            <input type="text" id="add-former-user-id" placeholder="User ID (as string)">
            <input type="text" id="add-former-guild-id" placeholder="Guild ID (as string)">
            <input type="date" id="add-left-date" placeholder="Left Date">
            <button onclick="addFormerUser()">Submit</button>
            <button onclick="toggleAddFormerUserForm()">Cancel</button>
          </div>
        </div>
      `;

      // Single column, horizontal card format
      html += '<div class="former-user-cards" style="display:flex;flex-direction:column;gap:16px;align-items:center;">';
      users.forEach(user => {
        html += `
          <div class="former-user-card" style="display:flex;align-items:center;gap:24px;border:1px solid #ccc;padding:16px;border-radius:8px;width:600px;max-width:90vw;">
            <div style="flex:1;">
              <strong>User ID:</strong> ${user.user_id}<br>
              <strong>Guild ID:</strong> ${user.guild_id}<br>
              <strong>Left Date:</strong> ${formatFormerUserDateDMY(user.left_date)}<br>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button onclick="confirmDeleteFormerUser('${user.user_id}', '${user.guild_id}')">Delete</button>
            </div>
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

      // Modal for delete confirmation
      if (deletingFormerUser) {
        html += `
          <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="modal" style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 2px 8px #0002;">
              <p>Are you sure you want to delete this former user?</p>
              <button onclick="deleteFormerUserConfirmed()">Yes, Delete</button>
              <button onclick="cancelDeleteFormerUser()">Cancel</button>
            </div>
          </div>
        `;
      }

      document.getElementById('tab-content').innerHTML = html;
    });
}

// Modal handlers
function confirmDeleteFormerUser(userId, guildId) {
  deletingFormerUser = { user_id: userId, guild_id: guildId };
  showFormerUsers();
}
function cancelDeleteFormerUser() {
  deletingFormerUser = null;
  showFormerUsers();
}
function deleteFormerUserConfirmed() {
  fetch(`/admin/api/former_users/${deletingFormerUser.user_id}/${deletingFormerUser.guild_id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      deletingFormerUser = null;
      showFormerUsers();
    });
}

// Add Former User form handlers
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

function formatFormerUserDateDMY(dateStr) {
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