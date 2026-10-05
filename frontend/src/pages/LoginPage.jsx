import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "USER",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

    return newErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (formData.role === "USER") {
      navigate("/dashboard", {
        state: {
          email: formData.email,
        },
      });

      return;
    }

    alert(
      "Admin dashboard will be connected later. Member 1 can integrate the admin authentication flow with the backend."
    );
  };

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    event.currentTarget.style.setProperty(
      "--mouse-x",
      `${event.clientX - rect.left}px`
    );

    event.currentTarget.style.setProperty(
      "--mouse-y",
      `${event.clientY - rect.top}px`
    );
  };

  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="ambient-orb orb-one"></div>
        <div className="ambient-orb orb-two"></div>
        <div className="ambient-orb orb-three"></div>

        <div className="background-grid"></div>

        <div className="brand-content">
          <div className="logo">
            <div className="logo-icon">
              <span>Q</span>
            </div>

            <span className="logo-text">
              Queue<span>Less</span>
            </span>
          </div>

          <div className="hero-content">
            <p className="eyebrow">SMART QUEUE MANAGEMENT</p>

            <h1>
              Spend less time
              <br />
              <span>waiting.</span>
            </h1>

            <p className="hero-description">
              Join queues digitally, track your position in real time, and make
              every visit faster and easier.
            </p>

            <div className="feature-list">
              <div className="feature">
                <div className="feature-icon">✓</div>

                <div>
                  <h3>Join remotely</h3>
                  <p>Reserve your place without standing in line.</p>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">✓</div>

                <div>
                  <h3>Live queue updates</h3>
                  <p>Know your position and estimated waiting time.</p>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">✓</div>

                <div>
                  <h3>Simple & efficient</h3>
                  <p>A smoother experience for customers and staff.</p>
                </div>
              </div>
            </div>

            <div className="queue-preview">
              <div className="queue-preview-top">
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  LIVE QUEUE
                </div>

                <span className="queue-number">A-17</span>
              </div>

              <div className="queue-preview-body">
                <div>
                  <span className="queue-label">Your position</span>
                  <strong>#5</strong>
                </div>

                <div className="queue-divider-line"></div>

                <div>
                  <span className="queue-label">People ahead</span>
                  <strong>4</strong>
                </div>

                <div className="queue-divider-line"></div>

                <div>
                  <span className="queue-label">Est. wait</span>
                  <strong>~8 min</strong>
                </div>
              </div>
            </div>
          </div>

          <p className="brand-footer">
            © 2026 QueueLess. Digital Queue Management System.
          </p>
        </div>

        <div className="decoration decoration-one"></div>
        <div className="decoration decoration-two"></div>
      </section>

      <section className="form-panel" onMouseMove={handleMouseMove}>
        <div className="login-container">
          <div className="login-heading">
            <p className="welcome-label">WELCOME BACK</p>

            <h2>Sign in to your account</h2>

            <p>Enter your details below to continue to QueueLess.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="role-section">
              <label className="field-label">Login as</label>

              <div className="role-selector">
                <label
                  className={`role-option ${
                    formData.role === "USER" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="USER"
                    checked={formData.role === "USER"}
                    onChange={handleChange}
                  />

                  <span className="role-icon">👤</span>

                  <span>
                    <strong>User</strong>
                    <small>Join & track queues</small>
                  </span>
                </label>

                <label
                  className={`role-option ${
                    formData.role === "ADMIN" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="ADMIN"
                    checked={formData.role === "ADMIN"}
                    onChange={handleChange}
                  />

                  <span className="role-icon">⚙</span>

                  <span>
                    <strong>Admin</strong>
                    <small>Manage queue services</small>
                  </span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <div
                className={`input-wrapper ${
                  errors.email ? "input-error" : ""
                }`}
              >
                <span className="input-icon">@</span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert("Forgot password feature will be added later.")
                  }
                >
                  Forgot password?
                </button>
              </div>

              <div
                className={`input-wrapper ${
                  errors.password ? "input-error" : ""
                }`}
              >
                <span className="input-icon">●</span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <label className="remember-option">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />

              <span>Remember me on this device</span>
            </label>

            <button className="login-button" type="submit">
              Sign in
              <span>→</span>
            </button>

            <div className="divider">
              <span></span>
              <p>New to QueueLess?</p>
              <span></span>
            </div>

            <button
              type="button"
              className="create-account-button"
              onClick={() => navigate("/register")}
            >
              Create an account
            </button>
          </form>

          <p className="security-text">
            🔒 Your information is protected and securely handled.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;