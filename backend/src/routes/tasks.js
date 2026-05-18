// routes/tasks.js - Task CRUD routes
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get MySQL user_id from Firebase UID
async function getUserId(firebase_uid) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE firebase_uid = ?',
    [firebase_uid]
  );
  return rows.length > 0 ? rows[0].id : null;
}

// POST /api/add-task
// Add a new task for the logged-in user
router.post('/add-task', async (req, res) => {
  const { firebase_uid, task, due_date } = req.body;

  if (!firebase_uid || !task) {
    return res.status(400).json({ error: 'firebase_uid and task are required' });
  }

  try {
    const user_id = await getUserId(firebase_uid);
    if (!user_id) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, task, due_date, status) VALUES (?, ?, ?, ?)',
      [user_id, task, due_date || null, 'uncompleted']
    );

    res.status(201).json({ message: 'Task added successfully', taskId: result.insertId });
  } catch (err) {
    console.error('Add task error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:uid
// Get all tasks for a specific user (by Firebase UID)
router.get('/tasks/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const user_id = await getUserId(uid);
    if (!user_id) {
      return res.status(200).json([]);
    }

    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );

    res.status(200).json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/task/:id
// Toggle task status between completed and uncompleted
router.put('/task/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/task/:id
// Delete a task by ID
router.delete('/task/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
