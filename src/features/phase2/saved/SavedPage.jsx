import { getSavedPosts } from "./saved.mock.js";

export function SavedPage() {
  return <div className="p-6 text-sm text-gray-500">Phase 2 saved placeholder: {getSavedPosts().length} saved posts prepared.</div>;
}

