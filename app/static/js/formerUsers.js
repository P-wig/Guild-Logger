// Function to fetch and display former users in a table
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