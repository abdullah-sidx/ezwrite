export default function StatusBanner({ tone = 'info', title, children }) {
  return (
    <div className={`status-banner tone-${tone}`} role="status" aria-live="polite">
      {title ? <strong className="status-banner-title">{title}</strong> : null}
      <div className="status-banner-body">{children}</div>
    </div>
  );
}
