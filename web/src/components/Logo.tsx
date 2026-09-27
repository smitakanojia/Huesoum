import { E } from '../state/store';

export default function Logo({ size = 26 }: { size?: number }) {
  return <span className="logo-wrap" dangerouslySetInnerHTML={{ __html: E.logo(size) }} />;
}

// Small helper to render an engine icon (SVG string) inside React.
export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className="ic-wrap" dangerouslySetInnerHTML={{ __html: E.ic(name, className) }} />;
}
