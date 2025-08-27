function toggleGuildDropdown() {
  const list = document.getElementById('guild-dropdown-list');
  list.style.display = (list.style.display === 'none' || !list.style.display) ? 'block' : 'none';
}

// Call this after login to populate guilds
function populateGuildDropdown(guilds) {
  console.log('Guilds:', guilds);
  const list = document.getElementById('guild-dropdown-list');
  list.innerHTML = '';
  guilds.forEach(guild => {
    const btn = document.createElement('button');
    btn.textContent = guild.name;
    btn.onclick = () => selectGuild(guild.id);
    list.appendChild(btn);
  });
}

function selectGuild(guildId) {
  // Store selected guildId and reload data for that guild
  window.selectedGuildId = guildId;
  document.getElementById('guild-dropdown-list').style.display = 'none';
  showUsers(1, 10, guildId); // Pass guildId to your data loaders
  // Repeat for events and former users as needed
}

function fetchAndPopulateGuilds() {
  fetch('/admin/api/guilds')
    .then(res => res.json())
    .then(guilds => {
      populateGuildDropdown(guilds);
    });
}

// Call this after page load
window.addEventListener('DOMContentLoaded', fetchAndPopulateGuilds);