import TeamCard from "../ui/TeamCard";
import { PlusLg } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom';


import icon from "../../assets/branding/icon.svg";
import { useCurrentUser } from "../../api/currentUser";
import { useState, useEffect } from "react";
import { loadTeams, type BrowseTeam } from "../../api/loadTeams";

function Teams() {
  const user = useCurrentUser();
  const [teams, setTeams] = useState<BrowseTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  const hasTeam = teams.some((t) => t.isMember || t.isCoach);

  const refresh = () => loadTeams().then(setTeams).catch(
    (err) => setLoadError('Could not load teams: ' + (err instanceof Error ? err.message : 'unknown error'))
  );

  // Reload whenever someone logs in or out
  useEffect(() => {
    if (user == null) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="groups d-flex flex-grow-1 align-items-start bg-stridex-grey">
      <div className="container d-flex flex-column align-items-center py-3 text-white">
        <div className="w-100 mb-4 d-flex justify-content-between">
          <h1 className="text-start mb-0">Groups</h1>
          {!hasTeam && (
            <Link
              to="/createteam"
              style={{ width: "40px", height: "40px" }}
              className="upload-circle btn btn-outline-light text-white rounded-circle d-inline-flex flex-shrink-0 align-items-center justify-content-center p-2 mt-1 transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
              aria-label="Manual Upload"
              title="Create New Group"
            >
              <PlusLg size={20} />
            </Link>
          )}
          
        </div>
        {!loading && loadError === '' && teams.length === 0 && (
          <p className="text-stridex-lightgrey">No teams yet. Create the first one!</p>
        )}

        <div className="row row-cols-1 row-cols-lg-2 g-4 w-100">
          {teams.map((team) => (
            <div className="col" key={team.id}>
              <TeamCard
                id={team.id}
                src={icon}
                title={team.name}
                location={[team.city, team.state].filter(Boolean).join(', ')}
                description={team.description}
                count={team.members ?? 0}
                status={team.isCoach ? 'coach' : team.isMember ? 'joined' : ''}
                joinCode={team.joinCode}
                canJoin={!hasTeam}
                onChange={refresh}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Teams;