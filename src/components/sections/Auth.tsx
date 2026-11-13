import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DoorOpenFill, PersonFillAdd, Google } from 'react-bootstrap-icons';

import { apiFetch } from '../../scripts/api';
import { saveSession, type Session } from '../../scripts/currentUser';
import './Auth.css';

const MIN_PASSWORD_LENGTH = 8;

/**
 * A component that renders a login or registration form based on the provided mode.
 * Sends the form to POST /api/login or POST /api/register and saves the returned session.
 * @param {Object} props - The component props.
 * @param {'login' | 'register'} props.mode - The mode of the form, either 'login' or 'register'.
 */
function Auth({ mode }: { mode: 'login' | 'register' }) {
  const isRegistering = mode === 'register';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    // Quick checks before bothering the server (it checks again)
    if (email.trim() === '' || password === '') {
      setError('Email and password are required');
      return;
    }
    if (isRegistering && password.length < MIN_PASSWORD_LENGTH) {
      setError('Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters');
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const session = await apiFetch<Session>(isRegistering ? '/register' : '/login', 'POST', {
        email: email,
        password: password,
      });
      saveSession(session);
      navigate('/training');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login d-flex flex-grow-1 align-items-center bg-stridex-grey">
      <div className="container d-flex flex-column align-items-center py-1 text-white">

        <form className="login-form d-flex flex-column gap-3 bg-stridex-black p-4 rounded-4" onSubmit={handleSubmit} noValidate>
          {/* Login and Register Button Headers */}
          <div className="login-form-header d-flex flex-row justify-content-center align-items-center gap-4">
            <Link
              to="/login"
              className={`btn rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-2 px-3 my-1
                ${isRegistering ? 'bg-stridex-grey' : 'bg-stridex-darkgreen'} transition-ui hover-bg-stridex-lightgrey-hover focus-stridex`}
            >
              <DoorOpenFill size={16} className="me-2" />
              Login
            </Link>

            <Link
              to="/register"
              className={`btn rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-2 px-3 my-1
                ${isRegistering ? 'bg-stridex-darkgreen' : 'bg-stridex-grey'} transition-ui hover-bg-stridex-lightgrey-hover focus-stridex`}
            >
              <PersonFillAdd size={16} className="me-2" />
              Sign Up
            </Link>
          </div>

          {/* Email Input */}
          <div className="form-group d-flex flex-column gap-1">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="form-control rounded-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
            />
          </div>

          {/* Password Input */}
          <div className="form-group d-flex flex-column gap-1">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="form-control rounded-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
            />
          </div>

          {/* Registration Confirm Password Input */}
          {isRegistering && (
            <div className="form-group d-flex flex-column gap-1">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="form-control rounded-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              />
            </div>
          )}

          {/* Error from validation or the API */}
          {error !== '' && (
            <div className="alert alert-danger py-2 mb-0" role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn bg-stridex-grey rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-2 px-3 my-1 mt-3 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex"
          >
            {submitting ? 'Please wait...' : isRegistering ? 'Sign up' : 'Login'}
          </button>

          <div className="or-divider">OR</div>

          {/* Google Auth Button (not implemented yet) */}
          <button
            type="button"
            disabled
            title="Coming soon"
            className="btn bg-stridex-grey rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-2 px-3 my-1 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex"
          >
            <Google size={16} className="me-2" />
            Continue with Google
          </button>

          {/* Swap Login and Register */}
          <div className="register-link text-center mt-2">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link to={isRegistering ? '/login' : '/register'} className="text-stridex-green">
              {isRegistering ? 'Login' : 'Sign up'}
            </Link>
          </div>
        </form>

      </div>
    </main>
  );
}

export default Auth;