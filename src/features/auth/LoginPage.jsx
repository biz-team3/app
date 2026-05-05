import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, login } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ username: "oosu.hada", password: "password" });
  const [error, setError] = useState("");

  if (authenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(form);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      if (err.message === "username and password are required") setError(t("loginRequired"));
      else if (err.message === "invalid credentials") setError(t("invalidLogin"));
      else setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-black">
      <div className="w-full max-w-[380px] border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-black">
        <h1 className="mb-8 text-[42px] text-black dark:text-white" style={{ fontFamily: "'Grand Hotel', cursive" }}>
          Instagram
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            placeholder={t("username")}
          />
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            placeholder={t("password")}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="mt-2 rounded-lg bg-blue-500 py-2 text-sm font-bold text-white transition hover:bg-blue-600">{t("login")}</button>
        </form>
        <p className="mt-6 text-xs text-gray-500">{t("loginHint")}</p>
      </div>
    </div>
  );
}
