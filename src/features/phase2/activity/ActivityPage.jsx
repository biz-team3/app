import { getActivitySections } from "./activity.mock.js";

export function ActivityPage() {
  return <div className="p-6 text-sm text-gray-500">Phase 2 activity placeholder: {getActivitySections().length} sections prepared.</div>;
}

