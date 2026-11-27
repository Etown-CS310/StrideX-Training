import { apiFetch } from '../api/client';

export type BrowseTeam = {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  members: number;
  isMember: boolean;
  isCoach: boolean;
  joinCode?: string;
  createdAt: string | null;
};

export async function loadTeams(): Promise<BrowseTeam[]> {
  const result = await apiFetch<{ teams: BrowseTeam[] }>('/team/browse');
  return result.teams;
}