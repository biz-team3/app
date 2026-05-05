import { createContext, useContext, useMemo, useState } from "react";
import { getMyProfile } from "../api/profileApi.js";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(null);

  const refreshProfile = async () => {
    const nextProfile = await getMyProfile();
    setProfile(nextProfile);
    return nextProfile;
  };

  const value = useMemo(() => ({ profile, setProfile, refreshProfile }), [profile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

