import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Beef, Eye, EyeOff, Lock, Mail } from "lucide-react";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire up authentication
    console.log({ email, password, remember });
    navigate("/dashboard");
  };

  return (
    <main className="lp-root">
      <div className="lp-wash" aria-hidden />
      <div className="lp-orb lp-orb--red" aria-hidden />
      <div className="lp-orb lp-orb--orange" aria-hidden />
      <div className="lp-orb lp-orb--yellow" aria-hidden />

      <div className="lp-shell">
        {/* Brand side */}
        <section className="lp-brand">

          <h1 className="lp-title">
            Taste the
            <br />
            <span>difference</span>
          </h1>

          <p className="lp-lede">
            Sign in to order flame-grilled classics, track your delivery in real time and
            collect points on every bite.
          </p>
        </section>

        {/* Glass login card */}
        <section className="lp-card-wrap">
          <div className="lp-card">
            <header className="lp-card-head">
              <button className="lp-logo" onClick={() => navigate("/")} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <Beef size={28} strokeWidth={1.8} />
              </button>
              <h2 className="lp-card-title">Welcome back</h2>
              <p className="lp-card-sub">Your food is one login away.</p>
            </header>

            <form className="lp-form" onSubmit={handleSubmit}>
              <label className="lp-label">
                <span className="lp-label-text">Email</span>
                <div className="lp-field">
                  <Mail className="lp-field-icon" size={18} strokeWidth={1.9} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@bigbite.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="lp-label">
                <span className="lp-label-text">Password</span>
                <div className="lp-field">
                  <Lock className="lp-field-icon" size={18} strokeWidth={1.9} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.9} />
                    ) : (
                      <Eye size={18} strokeWidth={1.9} />
                    )}
                  </button>
                </div>
              </label>

              <div className="lp-row">
                <button
                  type="button"
                  className="lp-remember"
                  onClick={() => setRemember((v) => !v)}
                  aria-pressed={remember}
                >
                  <span className={remember ? "lp-check lp-check--on" : "lp-check"}>
                    {remember ? "✓" : ""}
                  </span>
                  Remember me
                </button>
                <a className="lp-link" href="#">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="lp-btn lp-btn--primary">
                Sign in
                <ArrowRight className="lp-arrow" size={16} strokeWidth={2.4} />
              </button>

              <div className="lp-divider">
                <span>or</span>
              </div>

              <button type="button" className="lp-btn lp-btn--outline">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
                <span>
                  Continue with Google
                </span>
              </button>
            </form>

            <p className="lp-foot">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
