import { authPost } from "../api/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Please enter your full name.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must contain at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "Please agree to the terms before continuing.";
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    setSubmitting(true);
    setErrors({});
    try {
      await authPost("/register", { fullName: formData.fullName.trim(), email: formData.email.trim(), password: formData.password });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (error) { setErrors({ server: error.message }); }
    finally { setSubmitting(false); }
  };

  const getPasswordStrength = () => {
    const password = formData.password;

    if (!password) return 0;

    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return Math.min(score, 4);
  };

  const strength = getPasswordStrength();

  const strengthText = ["", "Weak", "Fair", "Good", "Strong"][strength];

  return (
    <main className="register-page">
      {/* LEFT SIDE */}

      <section className="register-brand-panel">
        <div className="register-grid"></div>

        <div className="register-orb register-orb-one"></div>
        <div className="register-orb register-orb-two"></div>
        <div className="register-orb register-orb-three"></div>

        <div className="register-brand-content">
          <div className="register-logo">
            <div className="register-logo-icon">Q</div>

            <span className="register-logo-text">
              Queue<span>Less</span>
            </span>
          </div>

          <div className="register-hero">
            <div className="register-badge">
              <span className="badge-dot"></span>
              JOIN QUEUELESS
            </div>

            <h1>
              Your time is
              <br />
              <span>valuable.</span>
            </h1>

            <p className="register-description">
              Create your QueueLess account and start managing your waiting
              time in a smarter way.
            </p>

            <div className="register-benefits">
              <div className="register-benefit">
                <div className="benefit-icon">✓</div>

                <div>
                  <strong>Join from anywhere</strong>
                  <p>Reserve your position before reaching the location.</p>
                </div>
              </div>

              <div className="register-benefit">
                <div className="benefit-icon">✓</div>

                <div>
                  <strong>Real-time updates</strong>
                  <p>Track your queue position and estimated waiting time.</p>
                </div>
              </div>

              <div className="register-benefit">
                <div className="benefit-icon">✓</div>

                <div>
                  <strong>One simple account</strong>
                  <p>Access QueueLess services quickly and securely.</p>
                </div>
              </div>
            </div>

            <div className="register-preview">
              <div className="preview-icon">⚡</div>

              <div>
                <span>Average time saved</span>
                <strong>Up to 40%</strong>
              </div>

              <div className="preview-status">
                <span></span>
                SMART QUEUE
              </div>
            </div>
          </div>

          <p className="register-footer">
            © 2026 QueueLess. Digital Queue Management System.
          </p>
        </div>
      </section>

      {/* RIGHT SIDE */}

      <section className="register-form-side">
        <div className="register-form-glow"></div>

        <div className="register-form-container">
          <button
            type="button"
            className="register-back-button"
            onClick={() => navigate("/login")}
          >
            <span>←</span>
            Back to login
          </button>

          <div className="register-heading">
            <p>CREATE ACCOUNT</p>

            <h2>Get started with QueueLess</h2>

            <span>
              Enter your details below to create your personal account.
            </span>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {errors.server && <p className="error-message" role="alert">{errors.server}</p>}
            {/* FULL NAME */}

            <div className="register-field">
              <label htmlFor="fullName">Full name</label>

              <div
                className={`register-input ${
                  errors.fullName ? "register-input-error" : ""
                }`}
              >
                <span className="register-input-icon">👤</span>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              {errors.fullName && (
                <span className="register-error">{errors.fullName}</span>
              )}
            </div>

            {/* EMAIL */}

            <div className="register-field">
              <label htmlFor="registerEmail">Email address</label>

              <div
                className={`register-input ${
                  errors.email ? "register-input-error" : ""
                }`}
              >
                <span className="register-input-icon">@</span>

                <input
                  id="registerEmail"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              {errors.email && (
                <span className="register-error">{errors.email}</span>
              )}
            </div>

            {/* PASSWORD */}

            <div className="register-field">
              <label htmlFor="registerPassword">Password</label>

              <div
                className={`register-input ${
                  errors.password ? "register-input-error" : ""
                }`}
              >
                <span className="register-input-icon">●</span>

                <input
                  id="registerPassword"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="register-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((number) => (
                      <span
                        key={number}
                        className={number <= strength ? "active" : ""}
                      ></span>
                    ))}
                  </div>

                  <small>{strengthText}</small>
                </div>
              )}

              {errors.password && (
                <span className="register-error">{errors.password}</span>
              )}
            </div>

            {/* CONFIRM PASSWORD */}

            <div className="register-field">
              <label htmlFor="confirmPassword">Confirm password</label>

              <div
                className={`register-input ${
                  errors.confirmPassword ? "register-input-error" : ""
                }`}
              >
                <span className="register-input-icon">●</span>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your password again"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="register-show-password"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <span className="register-error">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* TERMS */}

            <label className="register-terms">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
              />

              <span>
                I agree to the <button type="button">Terms</button> and{" "}
                <button type="button">Privacy Policy</button>.
              </span>
            </label>

            {errors.agreeTerms && (
              <span className="register-error register-terms-error">
                {errors.agreeTerms}
              </span>
            )}

            {/* BUTTON */}

            <button className="register-submit" type="submit" disabled={submitting}>
              <span>{submitting ? "Creating account…" : "Create account"}</span>
              <span className="register-arrow">→</span>
            </button>

            <div className="register-divider">
              <span></span>
              <p>Already registered?</p>
              <span></span>
            </div>

            <button
              type="button"
              className="register-login-button"
              onClick={() => navigate("/login")}
            >
              Sign in to your account
            </button>
          </form>

          <p className="register-security">
            🔒 Your information is securely handled by QueueLess.
          </p>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;