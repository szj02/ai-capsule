import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMe, getCapsules, createCapsule, updateCapsule, deleteCapsule, logout
} from '../api.js';

const emptyForm = {
  project_name: '', prompt_title: '', prompt_version: '', prompt_text: '',
  response_summary: '', category: '', usefulness: '', reviewed: false,
  improved: false, screenshot_url: '', notes: ''
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const me = await getMe();
        setUser(me.user);
        const rows = await getCapsules();
        setCapsules(rows);
      } catch (err) {
        // Not logged in / expired -> bounce to login.
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        const updated = await updateCapsule(editingId, form);
        setCapsules((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
        setEditingId(null);
      } else {
        const created = await createCapsule(form);
        setCapsules((cs) => [created, ...cs]);
      }
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      project_name: c.project_name,
      prompt_title: c.prompt_title,
      prompt_version: c.prompt_version || '',
      prompt_text: c.prompt_text,
      response_summary: c.response_summary || '',
      category: c.category || '',
      usefulness: c.usefulness || '',
      reviewed: !!c.reviewed,
      improved: !!c.improved,
      screenshot_url: c.screenshot_url || '',
      notes: c.notes || ''
    });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this capsule?')) return;
    await deleteCapsule(id);
    setCapsules((cs) => cs.filter((c) => c.id !== id));
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  if (loading) return <div className="page">Loading…</div>;

  return (
    <div className="page dashboard">
      <header>
        <h1>Your Capsules</h1>
        <div className="user-bar">
          <span>{user?.name}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="capsule-form">
        <h2>{editingId ? 'Edit capsule' : 'New capsule'}</h2>
        {error && <p className="error">{error}</p>}
        <div className="grid">
          <input name="project_name" placeholder="Project name" value={form.project_name} onChange={handleChange} required />
          <input name="prompt_title" placeholder="Prompt title" value={form.prompt_title} onChange={handleChange} required />
          <input name="prompt_version" placeholder="Version (v1, v2...)" value={form.prompt_version} onChange={handleChange} />
          <input name="category" placeholder="Category" value={form.category} onChange={handleChange} />
          <input name="usefulness" placeholder="Usefulness" value={form.usefulness} onChange={handleChange} />
          <input name="screenshot_url" placeholder="Screenshot URL (optional)" value={form.screenshot_url} onChange={handleChange} />
        </div>
        <textarea name="prompt_text" placeholder="Prompt text" value={form.prompt_text} onChange={handleChange} required />
        <textarea name="response_summary" placeholder="Response summary" value={form.response_summary} onChange={handleChange} />
        <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        <div className="checkboxes">
          <label><input type="checkbox" name="reviewed" checked={form.reviewed} onChange={handleChange} /> Reviewed</label>
          <label><input type="checkbox" name="improved" checked={form.improved} onChange={handleChange} /> Improved</label>
        </div>
        <div className="form-actions">
          <button type="submit">{editingId ? 'Save changes' : 'Add capsule'}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="capsule-list">
        {capsules.length === 0 && <p>No capsules yet — add your first one above.</p>}
        {capsules.map((c) => (
          <div className="capsule-card" key={c.id}>
            <h3>{c.prompt_title} <span className="tag">{c.prompt_version}</span></h3>
            <p className="meta">{c.project_name} · {c.category} · {c.usefulness}</p>
            <p>{c.prompt_text}</p>
            {c.response_summary && <p className="summary"><strong>Response:</strong> {c.response_summary}</p>}
            <p className="flags">
              {c.reviewed ? '✅ Reviewed' : '⬜ Not reviewed'} · {c.improved ? '✅ Improved' : '⬜ Not improved'}
            </p>
            <div className="card-actions">
              <button onClick={() => startEdit(c)}>Edit</button>
              <button onClick={() => handleDelete(c.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
