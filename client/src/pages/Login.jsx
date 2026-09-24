export default function Login() {
  // A plain <a> (not a React Router Link) so the browser does a real
  // navigation to /auth/github, which redirects to GitHub itself.
  return (
    <div className="page login">
      <h1>Sign in</h1>
      <p>Continue with your GitHub account to access your dashboard.</p>
      <a className="btn" href="/auth/github">Sign in with GitHub</a>
    </div>
  );
}
