export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" className="icon"><use href={`/assets/icons.svg#${name}`} /></svg>;
}
