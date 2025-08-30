function toggleGuildDropdown() {
  const list = document.getElementById('guild-dropdown-list');
  list.style.display = (list.style.display === 'none' || !list.style.display) ? 'block' : 'none';
}

// Call this after login to populate guilds
function populateGuildDropdown(guilds) {
  const list = document.getElementById('guild-dropdown-list');
  list.innerHTML = '';
  guilds.forEach(guild => {
    const btn = document.createElement('button');
    // Discord CDN for icons: https://cdn.discordapp.com/icons/{guild_id}/{icon}.png
    const iconUrl = guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';
    btn.innerHTML = `<img class="guild-icon" src="${iconUrl}" alt="icon"> ${guild.name}`;
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

// Call the appropriate render function when switching tabs
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});