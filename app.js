// Happy Pets - Main Application JavaScript
// Uses localStorage for data persistence

// ============================================
// DATA MANAGEMENT
// ============================================

const STORAGE_KEYS = {
  PETS: 'happypets_pets',
  TASKS: 'happypets_tasks',
  KINDNESS: 'happypets_kindness'
};

// Pet type configurations
const PET_CONFIG = {
  dog: { emoji: '🐶', color: '#FFE5A0', name: 'Dog' },
  cat: { emoji: '🐱', color: '#F8B4C4', name: 'Cat' },
  hamster: { emoji: '🐹', color: '#FFD4A0', name: 'Hamster' },
  bird: { emoji: '🐦', color: '#B8D4F1', name: 'Bird' },
  fish: { emoji: '🐟', color: '#95D5B2', name: 'Fish' },
  rabbit: { emoji: '🐰', color: '#E8D4F1', name: 'Rabbit' }
};

// Task configurations
const TASK_CONFIG = {
  'feed-morning': { icon: '🥣', name: 'Morning Food', time: 'Start the day right!' },
  'feed-evening': { icon: '🥣', name: 'Evening Food', time: 'Dinner time!' },
  'water': { icon: '💧', name: 'Fresh Water', time: 'Keep it clean!' },
  'walk': { icon: '🚶', name: 'Walk', time: 'Get some exercise!' },
  'play': { icon: '🎾', name: 'Playtime', time: '10 minutes of fun!' },
  'brush': { icon: '🪥', name: 'Brush Fur', time: 'Keep them fluffy!' },
  'clean': { icon: '🧹', name: 'Clean Cage/Litter', time: 'Nice and tidy!' },
  'check': { icon: '👀', name: 'Health Check', time: 'Eyes, ears, nose' }
};

// Fun facts by pet type
const FUN_FACTS = {
  dog: [
    "Dogs wag their tails to the right when they're happy!",
    "A dog's nose print is unique, like a fingerprint!",
    "Dogs can learn over 100 words and gestures!",
    "Petting a dog can lower your blood pressure!"
  ],
  cat: [
    "Cats purr at a frequency that can help heal bones!",
    "A cat's nose has a unique pattern, like a fingerprint!",
    "Cats spend 70% of their lives sleeping!",
    "A group of cats is called a clowder!"
  ],
  hamster: [
    "Hamsters can run up to 5 miles on their wheel at night!",
    "Hamsters have pouches that can hold food equal to their body weight!",
    "Hamsters are born with their teeth fully grown!",
    "Hamsters can remember their relatives!"
  ],
  bird: [
    "Some birds can learn to talk and recognize faces!",
    "Birds have hollow bones to help them fly!",
    "A bird's heart beats over 400 times per minute!",
    "Some birds can sleep with one eye open!"
  ],
  fish: [
    "Fish can recognize their owners!",
    "Some fish can live for over 100 years!",
    "Fish don't have eyelids, so they sleep with their eyes open!",
    "Goldfish can see more colors than humans!"
  ],
  rabbit: [
    "Rabbits can jump up to 3 feet high!",
    "A happy rabbit will jump and twist - it's called a binky!",
    "Rabbits can see almost 360 degrees around them!",
    "Rabbits purr when they're happy, just like cats!"
  ]
};

// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================

function getPets() {
  const data = localStorage.getItem(STORAGE_KEYS.PETS);
  return data ? JSON.parse(data) : [];
}

function savePets(pets) {
  localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets));
}

function addPet(petData) {
  const pets = getPets();
  const newPet = {
    id: Date.now().toString(),
    name: petData.name,
    type: petData.type,
    breed: petData.breed || '',
    tasks: petData.tasks || ['feed-morning', 'feed-evening', 'water'],
    createdAt: new Date().toISOString()
  };
  pets.push(newPet);
  savePets(pets);
  return newPet;
}

function getPet(petId) {
  const pets = getPets();
  return pets.find(p => p.id === petId);
}

function deletePet(petId) {
  const pets = getPets();
  const filtered = pets.filter(p => p.id !== petId);
  savePets(filtered);
  // Also delete task completions for this pet
  deleteTasksForPet(petId);
}

function updatePet(petId, updates) {
  const pets = getPets();
  const index = pets.findIndex(p => p.id === petId);
  if (index === -1) return null;

  pets[index] = {
    ...pets[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  savePets(pets);
  return pets[index];
}

// ============================================
// TASK COMPLETION TRACKING
// ============================================

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getTaskCompletions() {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : {};
}

function saveTaskCompletions(completions) {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(completions));
}

function isTaskComplete(petId, taskId) {
  const completions = getTaskCompletions();
  const today = getTodayKey();
  const key = `${petId}_${taskId}_${today}`;
  return !!completions[key];
}

function toggleTask(petId, taskId) {
  const completions = getTaskCompletions();
  const today = getTodayKey();
  const key = `${petId}_${taskId}_${today}`;

  if (completions[key]) {
    delete completions[key];
  } else {
    completions[key] = {
      completedAt: new Date().toISOString(),
      petId,
      taskId
    };
    // Add to kindness jar
    addKindness();
  }

  saveTaskCompletions(completions);
  return !!completions[key];
}

function getCompletedTasksForPet(petId) {
  const completions = getTaskCompletions();
  const today = getTodayKey();
  let count = 0;

  for (const key in completions) {
    if (key.startsWith(petId) && key.endsWith(today)) {
      count++;
    }
  }

  return count;
}

function deleteTasksForPet(petId) {
  const completions = getTaskCompletions();
  const filtered = {};

  for (const key in completions) {
    if (!key.startsWith(petId)) {
      filtered[key] = completions[key];
    }
  }

  saveTaskCompletions(filtered);
}

// ============================================
// KINDNESS JAR
// ============================================

function getKindness() {
  const data = localStorage.getItem(STORAGE_KEYS.KINDNESS);
  return data ? JSON.parse(data) : { total: 0, today: 0, lastDate: '' };
}

function addKindness() {
  const kindness = getKindness();
  const today = getTodayKey();

  if (kindness.lastDate !== today) {
    kindness.today = 0;
    kindness.lastDate = today;
  }

  kindness.total++;
  kindness.today++;

  localStorage.setItem(STORAGE_KEYS.KINDNESS, JSON.stringify(kindness));
  return kindness;
}

function getKindnessLevel() {
  const kindness = getKindness();
  // Returns a percentage (0-100) based on total kindness acts
  // Fills up every 20 tasks, then resets visually but keeps total
  return Math.min(100, (kindness.total % 20) * 5 + 5);
}

// ============================================
// UI RENDERING
// ============================================

function renderPetCards() {
  const container = document.getElementById('pet-cards-container');
  if (!container) return;

  const pets = getPets();

  let html = '';

  pets.forEach(pet => {
    const config = PET_CONFIG[pet.type] || PET_CONFIG.dog;
    const completedTasks = getCompletedTasksForPet(pet.id);
    const totalTasks = pet.tasks ? pet.tasks.length : 0;
    const allDone = completedTasks >= totalTasks && totalTasks > 0;

    html += `
      <a href="pet-view.html?id=${pet.id}" class="pet-card">
        <div class="pet-avatar" style="background: ${config.color}">${config.emoji}</div>
        <h2 class="pet-name">${escapeHtml(pet.name)}</h2>
        <p class="pet-type">${pet.breed || config.name}</p>
        <div class="pet-status">
          <span class="status-dot ${allDone ? 'done' : 'pending'}"></span>
          <span>${completedTasks} of ${totalTasks} done</span>
        </div>
      </a>
    `;
  });

  // Add Pet card
  html += `
    <a href="add-pet.html" class="pet-card add-pet">
      <div class="pet-avatar add">+</div>
      <h2 class="pet-name">Add Pet</h2>
      <p class="pet-type">Tap to add a new friend</p>
    </a>
  `;

  container.innerHTML = html;
}

function renderKindnessJar() {
  const jarFill = document.getElementById('jar-fill');
  const jarMessage = document.getElementById('jar-message');
  if (!jarFill) return;

  const level = getKindnessLevel();
  const kindness = getKindness();

  jarFill.style.height = level + '%';

  // Update message based on level
  if (jarMessage) {
    if (level < 25) {
      jarMessage.textContent = "Let's help our pets today!";
    } else if (level < 50) {
      jarMessage.textContent = "You're doing great!";
    } else if (level < 75) {
      jarMessage.textContent = "So much kindness!";
    } else {
      jarMessage.textContent = "Amazing helper!";
    }
  }
}

function renderPetDetail(petId) {
  const pet = getPet(petId);
  if (!pet) {
    window.location.href = 'index.html';
    return;
  }

  const config = PET_CONFIG[pet.type] || PET_CONFIG.dog;

  // Update header
  const header = document.querySelector('.pet-header');
  if (header) {
    header.style.background = `linear-gradient(135deg, ${config.color} 0%, ${lightenColor(config.color)} 100%)`;
  }

  const avatarEl = document.getElementById('pet-avatar');
  const nameEl = document.getElementById('pet-name');
  const typeEl = document.getElementById('pet-type');

  if (avatarEl) avatarEl.textContent = config.emoji;
  if (nameEl) nameEl.textContent = pet.name;
  if (typeEl) typeEl.textContent = pet.breed || config.name;

  // Render tasks
  renderTasks(pet);

  // Render fun fact
  renderFunFact(pet.type);
}

function shouldShowTaskToday(taskData) {
  // No schedule means daily (show every day)
  if (!taskData.schedule || taskData.schedule === 'daily') {
    return true;
  }
  // Weekly: check if today's day is in the days array
  if (taskData.schedule === 'weekly') {
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    return taskData.days && taskData.days.includes(today);
  }
  return true;
}

function renderTasks(pet) {
  const container = document.getElementById('task-list');
  if (!container) return;

  let html = '';
  const customTasks = pet.customTasks || [];

  // If no tasks array, nothing to show
  if (!pet.tasks || pet.tasks.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#7A7A7A;padding:20px;">No tasks set up yet. Tap Edit Pet to add some!</p>';
    return;
  }

  let tasksShown = 0;

  pet.tasks.forEach(taskId => {
    // Find task in customTasks array (new format)
    const taskData = customTasks.find(ct => ct.id === taskId);

    if (!taskData) {
      // Legacy support: check old TASK_CONFIG (always show daily)
      const legacyTask = TASK_CONFIG[taskId];
      if (!legacyTask) return;

      tasksShown++;
      const isComplete = isTaskComplete(pet.id, taskId);
      const hintText = (pet.taskHints && pet.taskHints[taskId]) || legacyTask.time;

      html += `
        <button class="task-button ${isComplete ? 'completed' : ''}"
                onclick="handleTaskClick('${pet.id}', '${taskId}')">
          <div class="task-icon">${legacyTask.icon}</div>
          <div class="task-content">
            <div class="task-name">${escapeHtml(legacyTask.name)}</div>
            <div class="task-time">${isComplete ? 'Done! ✨' : escapeHtml(hintText)}</div>
          </div>
          <div class="task-check">${isComplete ? '✓' : ''}</div>
        </button>
      `;
      return;
    }

    // Check if task should show today
    if (!shouldShowTaskToday(taskData)) {
      return;
    }

    tasksShown++;

    // New format: task data from customTasks
    const isComplete = isTaskComplete(pet.id, taskId);

    html += `
      <button class="task-button ${isComplete ? 'completed' : ''}"
              onclick="handleTaskClick('${pet.id}', '${taskId}')">
        <div class="task-icon">${taskData.icon}</div>
        <div class="task-content">
          <div class="task-name">${escapeHtml(taskData.name)}</div>
          <div class="task-time">${isComplete ? 'Done! ✨' : escapeHtml(taskData.details || 'Tap when done!')}</div>
        </div>
        <div class="task-check">${isComplete ? '✓' : ''}</div>
      </button>
    `;
  });

  if (tasksShown === 0) {
    html = '<p style="text-align:center;color:#7A7A7A;padding:20px;">No tasks scheduled for today! 🎉</p>';
  }

  container.innerHTML = html;
}

function renderFunFact(petType) {
  const container = document.getElementById('fun-fact-text');
  if (!container) return;

  const facts = FUN_FACTS[petType] || FUN_FACTS.dog;
  const randomFact = facts[Math.floor(Math.random() * facts.length)];

  container.innerHTML = `<strong>Did you know?</strong><br>${randomFact}`;
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleTaskClick(petId, taskId) {
  const isNowComplete = toggleTask(petId, taskId);

  // Re-render tasks
  const pet = getPet(petId);
  if (pet) {
    renderTasks(pet);
  }

  // Show a little celebration if completed
  if (isNowComplete) {
    showCelebration();
  }
}

function showCelebration() {
  // Create a quick celebration overlay
  const celebration = document.createElement('div');
  celebration.className = 'celebration';
  celebration.innerHTML = '💖';
  document.body.appendChild(celebration);

  setTimeout(() => {
    celebration.remove();
  }, 1000);
}

function handleDeletePet(petId) {
  if (confirm('Are you sure you want to remove this pet?')) {
    deletePet(petId);
    window.location.href = 'index.html';
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function lightenColor(hex) {
  // Simple color lightening
  return hex + '99';
}

function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Check which page we're on and initialize accordingly

  if (document.getElementById('pet-cards-container')) {
    // Home page
    renderPetCards();
    renderKindnessJar();
  }

  if (document.getElementById('task-list')) {
    // Pet detail page
    const petId = getUrlParam('id');
    if (petId) {
      renderPetDetail(petId);
    }
  }
});

// Add celebration styles dynamically
const celebrationStyles = document.createElement('style');
celebrationStyles.textContent = `
  .celebration {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 80px;
    animation: celebrateAnim 1s ease-out forwards;
    pointer-events: none;
    z-index: 1000;
  }

  @keyframes celebrateAnim {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(0.5);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -100%) scale(1);
    }
  }
`;
document.head.appendChild(celebrationStyles);
