const express = require('express');
const db = require('../db');
const { verifyJWT } = require('../auth');

const router = express.Router();

// Every route below requires a valid JWT. No JWT / invalid JWT -> 401,
// enforced by verifyJWT before any handler below runs.
router.use(verifyJWT);

// GET /api/capsules -> only the authenticated user's own records.
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(rows);
});

// POST /api/capsules -> owner is ALWAYS taken from the verified JWT,
// never from the request body.
router.post('/', (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes
  } = req.body;

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: 'project_name, prompt_title and prompt_text are required'
    });
  }

  const stmt = db.prepare(`
    INSERT INTO capsules
      (user_id, project_name, prompt_title, prompt_version, prompt_text,
       response_summary, category, usefulness, reviewed, improved,
       screenshot_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    req.user.id,
    project_name,
    prompt_title,
    prompt_version || null,
    prompt_text,
    response_summary || null,
    category || null,
    usefulness || null,
    reviewed ? 1 : 0,
    improved ? 1 : 0,
    screenshot_url || null,
    notes || null
  );

  const created = db.prepare('SELECT * FROM capsules WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/capsules/:id -> only if the record belongs to req.user.id.
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);

  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: not your record' });
  }

  const fields = [
    'project_name', 'prompt_title', 'prompt_version', 'prompt_text',
    'response_summary', 'category', 'usefulness', 'reviewed', 'improved',
    'screenshot_url', 'notes'
  ];

  const merged = { ...existing };
  for (const f of fields) {
    if (req.body[f] !== undefined) merged[f] = req.body[f];
  }

  db.prepare(`
    UPDATE capsules SET
      project_name = ?, prompt_title = ?, prompt_version = ?, prompt_text = ?,
      response_summary = ?, category = ?, usefulness = ?, reviewed = ?,
      improved = ?, screenshot_url = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    merged.project_name,
    merged.prompt_title,
    merged.prompt_version,
    merged.prompt_text,
    merged.response_summary,
    merged.category,
    merged.usefulness,
    merged.reviewed ? 1 : 0,
    merged.improved ? 1 : 0,
    merged.screenshot_url,
    merged.notes,
    req.params.id,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/capsules/:id -> only if the record belongs to req.user.id.
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);

  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: not your record' });
  }

  db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
