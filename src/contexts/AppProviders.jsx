import { AuthProvider } from "./AuthContext.jsx";
import { LanguageProvider } from "./LanguageContext.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";
import { UserProvider } from "./UserContext.jsx";

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <UserProvider>{children}</UserProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

