let currentPokemon = null;
const team = [];
const cache = {}; // cache to reduce API calls

const searchBtn  = document.getElementById('search-btn');
const pokeInput  = document.getElementById('poke-input');
const errorMsg   = document.getElementById('error-msg');
const spriteArea = document.getElementById('sprite-area');
const audioArea  = document.getElementById('audio-area');
const pokeAudio  = document.getElementById('poke-audio');
const movesArea  = document.getElementById('moves-area');
const addArea    = document.getElementById('add-area');
const addBtn     = document.getElementById('add-btn');
const teamTable  = document.getElementById('team-table');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}
function hideError() {
  errorMsg.style.display = 'none';
}

function populateMoves(moves) {
  ['move1', 'move2', 'move3', 'move4'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">— select —</option>';
    moves.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      sel.appendChild(opt);
    });
  });
}

async function fetchPokemon() {
  const query = pokeInput.value.trim().toLowerCase();
  if (!query) { showError('Please enter a name or ID.'); return; }

  hideError();
  spriteArea.innerHTML = '<span class="placeholder">Loading…</span>';
  audioArea.style.display = 'none';
  movesArea.style.display = 'none';
  addArea.style.display   = 'none';
  currentPokemon = null;

  try {
    // Use cache first
    let data;
    if (cache[query]) {
      data = cache[query];
      console.log('Using cached data for', query);
    } else {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
      if (!res.ok) throw new Error(`"${query}" not found.`);
      data = await res.json();
      cache[query] = data;
    }

    currentPokemon = data;

    // Sprite
    const sprite = data.sprites?.front_default || '';
    spriteArea.innerHTML = sprite
      ? `<img src="${sprite}" alt="${data.name}" />`
      : `<span class="placeholder">No image available</span>`;

    // Cry
    const cryUrl = data.cries?.latest || data.cries?.legacy || null;
    if (cryUrl) {
      pokeAudio.src = cryUrl;
      audioArea.style.display = 'block';
    }

    // Moves
    const moves = data.moves.map(m => m.move.name).sort();
    populateMoves(moves);
    movesArea.style.display = 'block';
    addArea.style.display = 'block';

  } catch (err) {
    showError(err.message);
    spriteArea.innerHTML = '<span class="placeholder">No Pokémon found.</span>';
  }
}

function renderTeam() {
  teamTable.innerHTML = '';
  team.forEach(member => {
    const tr = document.createElement('tr');

    const tdImg = document.createElement('td');
    tdImg.className = 'td-sprite';
    tdImg.innerHTML = `<img src="${member.sprite}" alt="${member.name}" />`;

    const tdMoves = document.createElement('td');
    tdMoves.className = 'td-moves';
    const ul = document.createElement('ul');
    member.selectedMoves.filter(m => m).forEach(m => {
      const li = document.createElement('li');
      li.textContent = m;
      ul.appendChild(li);
    });
    tdMoves.appendChild(ul);

    tr.appendChild(tdImg);
    tr.appendChild(tdMoves);
    teamTable.appendChild(tr);
  });
}

addBtn.addEventListener('click', () => {
  if (!currentPokemon) return;

  // Get the moves selected by the user
  const selectedMoves = ['move1', 'move2', 'move3', 'move4']
    .map(id => document.getElementById(id).value)
    .filter(m => m); // remove empty selections

  // Validation: at least 1 move must be selected
  if (selectedMoves.length === 0) {
    showError('You must select at least 1 move before adding to the team.');
    return; // stop here
  }

  if (team.length >= 6) {
    showError('Your team is full! (max 6)');
    return;
  }

  if (team.find(m => m.id === currentPokemon.id)) {
    showError(`${currentPokemon.name} is already on your team!`);
    return;
  }

  hideError();

  // Add Pokémon to the team
  team.push({
    id: currentPokemon.id,
    name: currentPokemon.name,
    sprite: currentPokemon.sprites?.front_default || '',
    selectedMoves
  });

  renderTeam();
});

searchBtn.addEventListener('click', fetchPokemon);
pokeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') fetchPokemon();
});
