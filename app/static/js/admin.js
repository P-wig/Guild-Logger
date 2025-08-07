// Function to fetch and display users in a table
function showUsers(page = 1, perPage = 10) {
  // Make a GET request to the /api/users endpoint with pagination
  fetch(`/admin/api/users?page=${page}&per_page=${perPage}`)
    .then(response => response.json()) // Parse the JSON response
    .then(users => {
      // Start building the HTML for the user cards
      let html = '<div class="user-cards" style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;">';
      // Add a card for each user
      users.forEach(user => {
        html += `
          <div class="user-card" style="border:1px solid #ccc;padding:16px;border-radius:8px;width:250px;box-shadow:2px 2px 8px #eee;">
            <strong>User ID:</strong> ${user.user_id}<br>
            <strong>Join Date:</strong> ${user.join_date}<br>
            <strong>Status:</strong> ${user.status}<br>
            <button onclick="editUser('${user.user_id}')">Edit</button>
          </div>
        `;
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
      // Insert the generated HTML into the page
      document.getElementById('tab-content').innerHTML = html;
    });
}

// define editUser for now
function editUser(userId) {
  alert('Edit user: ' + userId);
}

// Load first page on DOM ready
document.addEventListener('DOMContentLoaded', () => showUsers());

// Example fetch for logs (not implemented yet)
fetch('/api/logs')
  .then(response => response.json())
  .then(data => {
    // Placeholder: add logic here to handle the logs data
  });