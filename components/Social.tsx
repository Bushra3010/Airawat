import { SOCIALS } from "@/lib/business";
import { ICON_PATHS } from "@/lib/social-icons";

function SocialIcon({ name, size = 18 }: { name: (typeof SOCIALS)[number]["key"]; size?: number }) {
  if (name === "linkedin") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <rect x="2" y="2" width="20" height="20" rx="3" />
        <text x="12" y="17" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="Arial, sans-serif" fill="var(--color-ink)">in</text>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Airawat Handicraft on social media">
      {SOCIALS.map((s) => (
        <li key={s.key}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.label} (opens in a new tab)`}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/85 transition hover:bg-white hover:text-ink"
          >
            <SocialIcon name={s.key} />
          </a>
        </li>
      ))}
    </ul>
  );
}
