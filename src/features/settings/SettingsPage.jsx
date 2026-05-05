import { useNavigate } from "react-router-dom";
import { ProfileEditModal } from "../../components/modals/ProfileEditModal.jsx";

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <ProfileEditModal
      isOpen
      onClose={() => navigate("/profile", { replace: true })}
    />
  );
}
