import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="page landing">
      <h1>AI Capsule</h1>
      <p>A private place to save, review and improve the AI prompts you actually use.</p>
      <ul>
        <li>Save prompts with project, category and usefulness rating</li>
        <li>Track whether a response was reviewed and improved</li>
        <li>Sign in with GitHub — your capsules are private to you</li>
      </ul>
      <Link className="btn" to="/login">Sign in with GitHub</Link>
    </div>
  );
}
