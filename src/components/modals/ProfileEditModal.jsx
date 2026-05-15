import { useEffect, useRef, useState } from "react";
import { ChevronRight, Plus, X } from "lucide-react";
import { uploadProfileImage } from "../../api/mediaApi.js";
import { getMyProfile, updateProfile } from "../../api/profileApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { IMAGE_FILE_ACCEPT, validateImageFiles } from "../../utils/mediaValidation.js";

export function ProfileEditModal({ isOpen, onClose, onSaved }) {
  const { t } = useLanguage();
  const { refreshMe } = useAuth();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: "", name: "", bio: "", website: "", accountVisibility: "PUBLIC" });
  const [pendingProfileFile, setPendingProfileFile] = useState(null);
  const [pendingProfilePreviewUrl, setPendingProfilePreviewUrl] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setProfile(null);
    setPendingProfileFile(null);
    setPendingProfilePreviewUrl("");
    setSaved(false);
    setSaving(false);
    setError("");
    getMyProfile()
      .then((result) => {
        setProfile(result);
        setForm({
          username: result.username,
          name: result.name,
          bio: result.bio,
          website: result.website || "",
          accountVisibility: result.accountVisibility || "PUBLIC",
        });
      })
      .catch(() => {
        setError(t("profileLoadFailed"));
      });
  }, [isOpen, t]);

  useEffect(() => {
    return () => {
      if (pendingProfilePreviewUrl) URL.revokeObjectURL(pendingProfilePreviewUrl);
    };
  }, [pendingProfilePreviewUrl]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validation = validateImageFiles([file], { maxFiles: 1 });
    if (!validation.ok) {
      setError(t(validation.errorKey, validation.params));
      event.target.value = "";
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingProfileFile(file);
    setPendingProfilePreviewUrl(previewUrl);
    setProfile((current) => ({
      ...current,
      profileImageUrl: previewUrl,
    }));
    setSaved(false);
  };

  const handleClose = () => {
    setPendingProfileFile(null);
    setPendingProfilePreviewUrl("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      let nextProfileImageUrl = profile.profileImageUrl || "";
      if (pendingProfileFile) {
        const uploadResult = await uploadProfileImage(pendingProfileFile);
        nextProfileImageUrl = uploadResult.imageUrl;
      }

      const next = await updateProfile(profile.userId, {
        username: form.username,
        name: form.name,
        bio: form.bio,
        website: form.website,
        accountVisibility: form.accountVisibility,
        profileImageUrl: nextProfileImageUrl,
      });
      setPendingProfileFile(null);
      setPendingProfilePreviewUrl("");
      setProfile(next);
      await refreshMe();
      onSaved?.();
      setSaved(true);
      globalThis.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError(t("profileSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]" onMouseDown={handleClose}>
      <section
        className="flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="grid h-14 grid-cols-3 items-center border-b border-gray-100 px-4 dark:border-gray-800">
          <div />
          <h2 className="text-center text-sm font-bold">{t("editProfile")}</h2>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={handleClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-900">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {!profile ? (
          <div className={`flex min-h-[360px] items-center justify-center text-sm font-semibold ${error ? "text-red-500" : "text-gray-400"}`}>
            {error || t("loadingPosts")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto px-5 py-5">
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img src={profile.profileImageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-blue-500 p-1 text-white dark:border-zinc-950"
                      aria-label={t("changeProfilePhoto")}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{profile.username}</p>
                    <button type="button" onClick={() => fileInputRef.current.click()} className="mt-1 text-sm font-bold text-blue-500 hover:text-blue-600">
                      {t("changeProfilePhoto")}
                    </button>
                    <input ref={fileInputRef} type="file" accept={IMAGE_FILE_ACCEPT} className="hidden" onChange={handleFile} />
                  </div>
                </div>
              </div>

              <Field label={t("username")} name="username" value={form.username} onChange={handleChange} />
              <Field label={t("name")} name="name" value={form.name} onChange={handleChange} />
              <Field label={t("website")} name="website" value={form.website} onChange={handleChange} />

              <FieldFrame label={t("bio")}>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  className="h-24 w-full resize-none rounded-md border border-gray-200 bg-transparent p-3 text-sm outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-800"
                />
              </FieldFrame>

              <FieldFrame label={t("privacy")}>
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="flex min-h-11 w-full items-center justify-between rounded-md border border-gray-200 bg-transparent px-3 text-left outline-none hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {form.accountVisibility === "PRIVATE" ? t("privateAccountSetting") : t("publicAccount")}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {form.accountVisibility === "PRIVATE" ? t("privateAccountSettingDesc") : t("publicAccountDesc")}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                </button>
              </FieldFrame>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              {error ? <span className="mr-auto text-sm font-semibold text-red-500">{error}</span> : null}
              {saved ? <span className="text-sm font-semibold text-blue-500">{t("saved")}</span> : null}
              <button type="button" onClick={handleClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800">
                {t("cancel")}
              </button>
              <button disabled={saving} className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:bg-blue-300">{saving ? t("saving") : t("save")}</button>
            </div>
          </form>
        )}

        {privacyOpen && (
          <PrivacyModal
            value={form.accountVisibility}
            onClose={() => setPrivacyOpen(false)}
            onChange={(accountVisibility) => {
              setForm((current) => ({ ...current, accountVisibility }));
              setSaved(false);
              setPrivacyOpen(false);
            }}
            t={t}
          />
        )}
      </section>
    </div>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <FieldFrame label={label}>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-md border border-gray-200 bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-800"
      />
    </FieldFrame>
  );
}

function FieldFrame({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <div>{children}</div>
    </label>
  );
}

function PrivacyModal({ value, onChange, onClose, t }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]" onMouseDown={onClose}>
      <section
        className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="grid h-12 grid-cols-3 items-center border-b border-gray-100 px-4 dark:border-gray-800">
          <div />
          <h2 className="text-center text-sm font-bold">{t("privacy")}</h2>
          <button type="button" onClick={onClose} className="justify-self-end rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-900">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-3">
          <VisibilityOption label={t("publicAccount")} description={t("publicAccountDesc")} checked={value === "PUBLIC"} onChange={() => onChange("PUBLIC")} />
          <VisibilityOption label={t("privateAccountSetting")} description={t("privateAccountSettingDesc")} checked={value === "PRIVATE"} onChange={() => onChange("PRIVATE")} />
        </div>
      </section>
    </div>
  );
}

function VisibilityOption({ label, description, checked, onChange }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition ${checked ? "bg-blue-50 dark:bg-blue-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-900"}`}>
      <input type="radio" name="accountVisibility" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${checked ? "border-blue-500" : "border-gray-300 dark:border-gray-700"}`}>
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-gray-500">{description}</span>
      </span>
    </label>
  );
}
