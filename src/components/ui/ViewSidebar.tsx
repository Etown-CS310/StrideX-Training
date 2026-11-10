import { useState } from 'react';

import ActivityCard from "../ui/ActivityCard";
import type { Activity } from '../../scripts/loadActivities';
import { ACTIVITY_TYPES } from '../../scripts/activityTypes';

const METERS_PER_MILE = 1609.344;

interface ViewSidebarProps {
    activities: Activity[];
    selectedId?: string | null;
    onSelect?: (id: string) => void;
}

/**
 * Searchable list of the user's activities, newest first. Clicking one opens it for editing.
 */
function ViewSidebar({ activities, selectedId, onSelect }: ViewSidebarProps) {
    const [search, setSearch] = useState('');
    const [sport, setSport] = useState('Default');

    const searchText = search.trim().toLowerCase();
    const shown = activities
        .filter((activity) => sport === 'Default' || activity.type === sport)
        .filter((activity) => searchText === '' || (activity.title ?? '').toLowerCase().includes(searchText))
        .sort((a, b) => (b.startTime?.getTime() ?? 0) - (a.startTime?.getTime() ?? 0));

    return (
        <div>
            <div className="row p-1 pb-3">
                <div className="col-6 p-2">
                    <input
                        id="activity-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-100 form-control rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                        placeholder="Search Activity"
                        aria-label="Search Activity"
                    />
                </div>

                <div className="col-6 p-2">
                    <select
                        id="activity"
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        className="form-select col-6 rounded-pill bg-transparent text-white border-white transition-ui hover-bg-stridex-lightgrey-hover focus-stridex"
                        aria-label="Activity Type"
                    >
                        <option value="Default">All</option>
                        {ACTIVITY_TYPES.map((option) => (
                            <option key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {shown.length === 0 && (
                <p className="text-stridex-lightgrey text-center">No activities found</p>
            )}

            {shown.map((activity) => (
                <ActivityCard
                    key={activity.id}
                    title={activity.title}
                    distance={(activity.distance ?? 0) / METERS_PER_MILE}
                    disttype="mi"
                    time={activity.duration ?? 0}
                    activity={activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    selected={activity.id === selectedId}
                    onClick={onSelect ? () => onSelect(activity.id) : undefined}
                />
            ))}
        </div>
    )
}

export default ViewSidebar;
