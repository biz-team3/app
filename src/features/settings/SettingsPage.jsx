import { useNavigate } from "react-router-dom";
import { SystemSettingsModal } from "../../components/modals/SystemSettingsModal.jsx";

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <SystemSettingsModal
      isOpen
      onClose={() => navigate("/", { replace: true })}
    />
  );
}
