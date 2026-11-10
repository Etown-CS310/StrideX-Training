import { Link } from 'react-router-dom';
import { DoorOpenFill, PersonFillAdd, Google } from 'react-bootstrap-icons';
import './Auth.css';

/**
 * A component that renders a login or registration form based on the provided mode.
 * @param {Object} props - The component props.
 * @param {'login' | 'register'} props.mode - The mode of the form, either 'login' or 'register'.
 */
function Auth({ mode }: { mode: 'login' | 'register' }) {
  const isRegistering = mode === 'register';

  return (
    <main className="login d-flex flex-grow-1 align-items-center bg-stridex-grey">
      <div className="container d-flex flex-column align-items-center py-1 text-white">
        
        <form className="login-form d-flex flex-column gap-3 bg-stridex-black p-4 rounded-4">
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
              type="text"
              id="email"
              name="email"
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
                placeholder="Confirm your password"
                className="form-control rounded-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn bg-stridex-grey rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-2 px-3 my-1 mt-3 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex"
          >
            {isRegistering ? 'Sign up' : 'Login'}
          </button>

          <div className="or-divider">OR</div>

          {/* Google Auth Button */}
          <button
            type="submit"
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