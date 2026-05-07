import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Search, Trash2, UserRound } from "lucide-react";
import { createUser, deleteUser, getUsers, updateUser } from "../../api/usersApi.js";
import { useAuth } from "../../hooks/useAuth.js";

const EMPTY_FORM = {
  username: "",
  name: "",
  bio: "",
  website: "",
  profileImageUrl: "",
  accountVisibility: "PUBLIC",
};

const FALLBACK_PROFILE_IMAGE = "/oosu.hada.jpg";

function userToForm(user) {
  return {
    username: user.username || "",
    name: user.name || "",
    bio: user.bio || "",
    website: user.website || "",
    profileImageUrl: user.profileImageUrl || "",
    accountVisibility: user.accountVisibility || "PUBLIC",
  };
}

function visibilityLabel(value) {
  return value === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

export function UserCrudPage() {
  const { user: authUser, refreshMe } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId) || null,
    [selectedUserId, users],
  );

  const loadUsers = useCallback(async (nextQuery = query) => {
    setLoading(true);
    setError("");
    try {
      const result = await getUsers({ query: nextQuery, size: 100 });
      setUsers(result.users);
      return result.users;
    } catch (err) {
      setError(err.message || "사용자를 불러오지 못했습니다.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setNotice("");
  };

  const handleNew = () => {
    setSelectedUserId(null);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
  };

  const handleSelect = (user) => {
    setSelectedUserId(user.userId);
    setForm(userToForm(user));
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (selectedUserId) {
        await updateUser(selectedUserId, form);
        const nextUsers = await loadUsers();
        const updatedUser = nextUsers.find((user) => user.userId === selectedUserId);
        if (updatedUser) setForm(userToForm(updatedUser));
        if (authUser?.userId === selectedUserId) await refreshMe();
        setNotice("사용자를 수정했습니다.");
      } else {
        await createUser(form);
        setQuery("");
        const nextUsers = await loadUsers("");
        const createdUser = nextUsers.find((user) => user.username === form.username.trim());
        setSelectedUserId(createdUser?.userId || null);
        if (createdUser) setForm(userToForm(createdUser));
        setNotice("사용자를 생성했습니다.");
      }
    } catch (err) {
      setError(err.message || "사용자 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const confirmed = globalThis.confirm(`@${selectedUser.username} 사용자를 삭제할까요?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await deleteUser(selectedUser.userId);
      setSelectedUserId(null);
      setForm(EMPTY_FORM);
      await loadUsers();
      setNotice("사용자를 삭제했습니다.");
    } catch (err) {
      setError(err.message || "사용자 삭제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 pb-24 md:px-8 md:py-8">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-gray-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Mock DB</p>
          <h1 className="mt-1 text-2xl font-bold">사용자 CRUD</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-800 sm:w-72">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="사용자 검색"
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => loadUsers()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-3 text-sm font-bold text-white hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            새 사용자
          </button>
        </div>
      </header>

      {error || notice ? (
        <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-600 dark:bg-red-950/30" : "bg-blue-50 text-blue-600 dark:bg-blue-950/30"}`}>
          {error || notice}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
            <h2 className="text-sm font-bold">사용자 목록</h2>
            <span className="text-xs font-semibold text-gray-500">{loading ? "불러오는 중" : `${users.length}명`}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-950">
                <tr>
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Visibility</th>
                  <th className="px-4 py-3 font-bold">Posts</th>
                  <th className="px-4 py-3 font-bold">Followers</th>
                  <th className="px-4 py-3 font-bold">Following</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const active = user.userId === selectedUserId;
                  return (
                    <tr
                      key={user.userId}
                      onClick={() => handleSelect(user)}
                      className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-900 dark:hover:bg-gray-950 ${active ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <img src={user.profileImageUrl || FALLBACK_PROFILE_IMAGE} alt="" className="h-10 w-10 rounded-full object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate font-bold">@{user.username}</span>
                            <span className="block truncate text-xs text-gray-500">{user.name}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">{visibilityLabel(user.accountVisibility)}</td>
                      <td className="px-4 py-3">{user.postCount}</td>
                      <td className="px-4 py-3">{user.followerCount}</td>
                      <td className="px-4 py-3">{user.followingCount}</td>
                    </tr>
                  );
                })}
                {!loading && users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-sm text-gray-500">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="border border-gray-200 dark:border-gray-800">
          <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
            <h2 className="text-sm font-bold">{selectedUser ? `@${selectedUser.username}` : "새 사용자"}</h2>
            <UserRound className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <img src={form.profileImageUrl || FALLBACK_PROFILE_IMAGE} alt="" className="h-14 w-14 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <label className="text-xs font-bold text-gray-500">profileImageUrl</label>
                <input
                  name="profileImageUrl"
                  value={form.profileImageUrl}
                  onChange={handleChange}
                  placeholder="/uploads/profiles/user.jpg"
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-gray-400 dark:border-gray-800"
                />
              </div>
            </div>

            <Field label="username" name="username" value={form.username} onChange={handleChange} required />
            <Field label="name" name="name" value={form.name} onChange={handleChange} />
            <Field label="website" name="website" value={form.website} onChange={handleChange} />

            <label className="block">
              <span className="text-xs font-bold text-gray-500">bio</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="mt-1 h-24 w-full resize-none rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-800"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-gray-500">accountVisibility</span>
              <select
                name="accountVisibility"
                value={form.accountVisibility}
                onChange={handleChange}
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-gray-400 dark:border-gray-800"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!selectedUser || saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </button>
            <button
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-bold text-white hover:bg-blue-600 disabled:bg-blue-300"
            >
              <Save className="h-4 w-4" />
              {saving ? "저장 중" : selectedUser ? "수정 저장" : "생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-gray-400 dark:border-gray-800"
      />
    </label>
  );
}
