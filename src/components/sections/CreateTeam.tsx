import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../../api/client';
import type { Team } from '../../../server/lib/teamAccess';

function CreateTeam() {
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create a new team and navigate to the teams page on success
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    // Quick checks before bothering the server (it checks again)
    if (name.trim() === '') {
      setError('Team name is required');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<Team>('/team', 'POST', {
        name: name,
        description: description,
        city: city,
        state: state,
      });
      navigate('/teams');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  } 

  return (
    <main className="create-team d-flex flex-grow-1 align-items-center bg-stridex-grey">
      <div className="container d-flex flex-column align-items-center py-3 text-white">
        {/* col-12 col-lg-8 col-xxl-9 */}
        <form onSubmit={handleSubmit} noValidate className="create-team-form d-flex flex-column gap-3 bg-stridex-black p-4 rounded-4 col-12 col-lg-8 col-xxl-9">

          <h2 className="text-center">Create a Team</h2>

          {/* Team Name */}
          <div className="form-group d-flex flex-column gap-1">
            <label htmlFor="team-name">Team Name</label>
            <input
              type="text"
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your team name"
              className="form-control rounded-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
            />
          </div>

          {/* Team Description */}
          <div className="form-group d-flex flex-column gap-1">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your team..."
              className="form-control rounded-4 bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              rows={4}
            />
          </div>

          {/* City and State */}
          <label className="d-flex flex-column gap-1" htmlFor="location">
            City and State
            <div id="location" className="input-group flex-nowrap">
              <input
                type="string"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Elizabethtown"
                className="form-control rounded-start-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                aria-label="City"
              />
              <span className="input-group-text bg-stridex-grey text-white border-0 px-0" aria-hidden="true">,</span>
              <input
                type="string"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="PA"
                className="form-control rounded-end-pill bg-stridex-grey text-white border-0 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                aria-label="State"
              />
            </div>
          </label>

          {/* Error Message */}
          {error && <div className="alert alert-danger text-center">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn bg-stridex-grey rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-2 px-3 my-1 mt-3 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex"
          >
            {submitting ? 'Creating...' : 'Create Team'}
          </button>

        </form>
      </div>
    </main>
  );
}





export default CreateTeam;