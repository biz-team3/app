export function ConfirmDialog({ title, description, confirmLabel, cancelLabel, destructive = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm" onMouseDown={onCancel}>
      <section
        className="w-full max-w-[360px] rounded-2xl bg-white p-5 text-left shadow-2xl ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div>
          <h2 className="text-base font-bold text-gray-950 dark:text-white">{title}</h2>
          {description ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p> : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-200 dark:bg-zinc-900 dark:text-gray-100 dark:hover:bg-zinc-800">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${
              destructive ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
