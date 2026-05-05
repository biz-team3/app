import { AppProviders } from "./contexts/AppProviders.jsx";
import { AppRoutes } from "./routes/AppRoutes.jsx";

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
