import { useState } from 'react';
import { apiFetch } from '../../api/client';

interface TeamCardProps {
  id: string;
  src: string;
  title: string;
  location: string;
  description: string;
  count: number;
  status: 'coach' | 'joined' | '';
  joinCode?: string;
  canJoin?: boolean;
  onChange?: () => void;
}

function TeamCard({ id, src, title, location, description, count, status, joinCode, canJoin = true, onChange }: TeamCardProps) {
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, failMessage: string) {
    setBusy(true);
    try {
      await action();
      onChange?.();
    } catch (err) {
      alert(failMessage + ': ' + (err instanceof Error ? err.message : 'unknown error'));
    } finally {
      setBusy(false);
    }
  }

  const join = () => {
    const code = prompt('Enter the team join code:')?.trim();
    if (!code) return;
    run(() => apiFetch('/team/join', 'POST', { code, teamId: id }), 'Could not join team');
  };

  const leave = () => {
    if (!confirm('Leave this team?')) return;
    run(() => apiFetch('/team/leave', 'POST'), 'Could not leave team');
  };

  const remove = () => {
    if (!confirm('Delete this team? All members will be removed and its goals deleted.')) return;
    run(() => apiFetch('/team', 'DELETE'), 'Could not delete team');
  };

  const buttonClass = 'btn btn-outline-stridex-lightgrey text-white rounded-pill d-inline-flex align-items-center justify-content-center p-2 px-3 transition-bg hover-bg-stridex-lightgrey-hover m-0';

  return (
    <div className="card rounded-4 bg-stridex-black mb-3">        
      <div className="card-body d-flex flex-column justify-content-between h-100 gap-3 text-white">
        <div className="row">
          <div className="col-2">
            <img src={src} alt="" />
          </div>
          <div className="col-10 d-flex flex-column justify-content-center">
            <h2 className="card-title">{title}</h2>
            <p className="card-subtitle mb-2 text-stridex-lightgrey">{location}</p>
          </div>
        </div>

        <div className="row">
          <p className="card-text">{description}</p>
        </div>

        <div className="d-flex justify-content-between">
          <p className="card-text text-stridex-lightgrey m-0">
            Members: {count.toLocaleString()}
            {status === 'coach' && joinCode && (
              <span className="ms-2">Join Code: {joinCode}</span>
            )}
          </p>

          {status === 'coach' && (
            <button onClick={remove} disabled={busy} className={buttonClass + ' hover-bg-danger-hover focus-danger'}>Delete</button>
          )}
          {status === 'joined' && (
            <button onClick={leave} disabled={busy} className={buttonClass}>Leave</button>
          )}
          {status === '' && (
            <button onClick={join} disabled={busy || !canJoin} className={buttonClass}>Join</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamCard;