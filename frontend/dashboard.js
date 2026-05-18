const API_BASE = 'https://todo-master-virid.vercel.app/api';

let currentUser = null;
let allTasks = [];
let activeFilter = 'all';

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = user;

  const emailEl = document.getElementById('userEmail');
  const avatarEl = document.getElementById('userAvatar');
  emailEl.textContent = user.email;
  avatarEl.textContent = user.email.charAt(0).toUpperCase();

  await registerUserInDB(user.uid, user.email);
  await loadTasks();
});

async function registerUserInDB(uid, email) {
  try {
    await fetch(`${API_BASE}/register-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebase_uid: uid, email })
    });
  } catch (err) {
    console.error('Failed to register user in DB:', err);
  }
}

// Logout 
async function logout() {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// Load All Tasks
async function loadTasks() {
  try {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('taskList').innerHTML = '';
    document.getElementById('emptyState').style.display = 'none';

    const response = await fetch(`${API_BASE}/tasks/${currentUser.uid}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');

    allTasks = await response.json();
    updateStats();
    renderTasks();
  } catch (err) {
    console.log(err);
    showAddMessage('Failed to load tasks. Is the backend running?', true);
  } finally {
    document.getElementById('loadingState').style.display = 'none';
  }
}

// Add Task 
async function addTask() {
  const taskInput = document.getElementById('taskInput');
  const dueDateInput = document.getElementById('dueDateInput');
  const taskText = taskInput.value.trim();
  const dueDate = dueDateInput.value;

  if (!taskText) {
    return showAddMessage('Please enter a task description.', true);
  }

  try {
    const response = await fetch(`${API_BASE}/add-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        task: taskText,
        due_date: dueDate || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || 'Failed to add task';
      throw new Error(message);
    }

    // Clear inputs and reload
    taskInput.value = '';
    dueDateInput.value = '';
    showAddMessage('Task added successfully!', false);
    await loadTasks();

    // Hide success message after 2s
    setTimeout(() => hideAddMessage(), 2000);
  } catch (err) {
    console.error('Add task error:', err);
    showAddMessage(err.message || 'Failed to add task. Is the backend running?', true);
  }
}

//  Toggle Task Status 
async function toggleTask(taskId, currentStatus) {
  const newStatus = currentStatus === 'completed' ? 'uncompleted' : 'completed';

  try {
    const response = await fetch(`${API_BASE}/task/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Failed to update task');

    await loadTasks();
  } catch (err) {
    console.error('Toggle task error:', err);
    showAddMessage('Failed to update task.', true);
  }
}

//  Delete Task 
async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const response = await fetch(`${API_BASE}/task/${taskId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete task');

    await loadTasks();
  } catch (err) {
    console.error('Delete task error:', err);
    showAddMessage('Failed to delete task.', true);
  }
}

//  Filter Tasks
function filterTasks(filter, button) {
  activeFilter = filter;

  // Update active filter button style
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  renderTasks();
}

//  Render Task List 
function renderTasks() {
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');

  // Filter tasks based on active filter
  let filtered = allTasks;
  if (activeFilter !== 'all') {
    filtered = allTasks.filter(t => t.status === activeFilter);
  }

  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item ' + (task.status === 'completed' ? 'completed' : '');

    // Format the due date nicely
    const dueDateText = task.due_date
      ? new Date(task.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'No due date';

    li.innerHTML = `
      <div class="task-left">
        <button class="check-btn ${task.status === 'completed' ? 'checked' : ''}"
          onclick="toggleTask(${task.id}, '${task.status}')"
          title="${task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}">
          ${task.status === 'completed' ? '✓' : ''}
        </button>
        <div class="task-content">
          <span class="task-text">${escapeHtml(task.task)}</span>
          <span class="task-date">📅 ${dueDateText}</span>
        </div>
      </div>
      <div class="task-right">
        <span class="status-badge ${task.status}">${task.status}</span>
        <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete task">🗑️</button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

//  Update Statistics ─
function updateStats() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.status === 'completed').length;
  const pending = total - completed;

  document.getElementById('totalCount').textContent = total;
  document.getElementById('completedCount').textContent = completed;
  document.getElementById('pendingCount').textContent = pending;
}

//  Utility: Show/Hide message inside add section ───────
function showAddMessage(text, isError) {
  const box = document.getElementById('addMessageBox');
  box.textContent = text;
  box.className = 'message-box ' + (isError ? 'error' : 'success');
  box.style.display = 'block';
}

function hideAddMessage() {
  document.getElementById('addMessageBox').style.display = 'none';
}

//  Utility: Escape HTML to prevent XSS ─────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
