import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { DoorOpenFill, PersonFillAdd } from 'react-bootstrap-icons';

import { apiFetch } from '../../api/client';
import { saveSession, type Session } from '../../api/currentUser';



function CreateTeam() {
  return (
    <main className="create-team d-flex flex-grow-1 align-items-center bg-stridex-grey">
      <div className="container d-flex flex-column align-items-center py-3 text-white">
        {/* col-12 col-lg-8 col-xxl-9 */}
        <div className="create-team-form d-flex flex-column gap-3 bg-stridex-black p-4 rounded-4 col-12 col-lg-8 col-xxl-9">

          <h2 className="text-center">Create a Team</h2>

          {/* Team Name */}
          <div className="form-group d-flex flex-column gap-1">
            <label htmlFor="team-name">Team Name</label>
            <input
              type="text"
              id="team-name"
              placeholder="Enter your team name"
              className="form-control rounded-pill bg-stridex-grey text-white border-0"
            />
          </div>

          {/* Team Description */}
          <div className="form-group d-flex flex-column gap-1">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe your team..."
              className="form-control bg-stridex-grey text-white border-0"
              rows={4}
            />
          </div>

          {/* City */}
          <div className="form-group d-flex flex-column gap-1">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              placeholder="Enter your city"
              className="form-control rounded-pill bg-stridex-grey text-white border-0"
            />
          </div>

          {/* State */}
          <div className="form-group d-flex flex-column gap-1">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              placeholder="Enter your state"
              className="form-control rounded-pill bg-stridex-grey text-white border-0"
            />
          </div>

          {/* Submit Button (Visual Only) */}
          <button
            type="button"
            className="btn bg-stridex-grey rounded-pill border-0 text-white p-2 px-3 mt-3"
          >
            Create Team
          </button>

        </div>
      </div>
    </main>
  );
}





export default CreateTeam;