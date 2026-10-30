function Toast({ title, content, onOpen, onClose }) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 top-16 z-50 flex items-start gap-3 rounded-xl border border-night-border bg-night-card p-3 shadow-lg md:left-auto md:right-6 md:w-80"
    >
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <p className="truncate text-sm font-semibold text-gold">{title}</p>
        <p className="truncate text-sm text-ink">{content}</p>
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la notification"
        className="cursor-pointer px-1 text-lg leading-none text-mist hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;