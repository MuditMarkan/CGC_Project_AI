export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <header className="section-title"><p>{eyebrow}</p><h2>{title}</h2>{copy ? <span>{copy}</span> : null}</header>;
}

export function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "violet" | "green" | "orange" | "red" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function Progress({ label, value, tone = "cyan" }: { label: string; value: number; tone?: "cyan" | "blue" | "violet" | "orange" | "red" | "green" }) {
  return <div className="progress-item"><div><span>{label}</span><b>{value}%</b></div><div className="track"><i className={tone} style={{ width: `${value}%` }} /></div></div>;
}
