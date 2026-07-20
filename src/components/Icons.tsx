import { useId } from "react";

export function ChevronRightIcon({ size = 24, color = "#000624" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 5l7 7-7 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrescentMoonIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  const maskId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <circle cx="15.5" cy="8.5" r="9" fill="black" />
      </mask>
      <circle cx="12" cy="12" r="10" fill={color} mask={`url(#${maskId})`} />
    </svg>
  );
}

// phase 0/1 = new moon, 0.5 = full moon, with crescent/gibbous in between.
export function MoonPhaseIcon({ phase, size = 24, color = "#fff" }: { phase: number; size?: number; color?: string }) {
  const maskId = useId();
  const r = 10;
  const t = phase <= 0.5 ? phase / 0.5 : (1 - phase) / 0.5; // 0 at new moon, 1 at full moon
  const offset = (1 - t) * r * 2;
  const dir = phase <= 0.5 ? 1 : -1;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <circle cx={12 + dir * offset} cy="12" r={r} fill="black" />
      </mask>
      <circle cx="12" cy="12" r={r} fill={color} mask={`url(#${maskId})`} />
    </svg>
  );
}

export function AddAIIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="14" height="14" rx="4" stroke={color} strokeWidth={1.6} />
      <path d="M12 9v6M9 12h6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8.5" r="3.3" stroke={color} strokeWidth={1.6} />
      <path
        d="M5 19c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CalendarIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke={color} strokeWidth={1.6} />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function TableChartIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="4" width="17" height="16" rx="2" stroke={color} strokeWidth={1.6} />
      <path d="M3.5 10h17M9.5 10v10" stroke={color} strokeWidth={1.6} />
    </svg>
  );
}

export function LayoutGalleryIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth={1.6} />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth={1.6} />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth={1.6} />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth={1.6} />
    </svg>
  );
}

export function FilterIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 5h16l-6 7.5V18l-4 2v-7.5L4 5z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkleIcon({ size = 12, color = "#333" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 0.5l.75 2.85a4.25 4.25 0 0 0 2.9 2.9L13.5 7l-2.85.75a4.25 4.25 0 0 0-2.9 2.9L7 13.5l-.75-2.85a4.25 4.25 0 0 0-2.9-2.9L0.5 7l2.85-.75a4.25 4.25 0 0 0 2.9-2.9L7 0.5z"
        fill={color}
      />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 24, color = "#000624" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 5l-7 7 7 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRightIcon({ size = 24, color = "#000624" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 5l7 7-7 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowUpIcon({ size = 20, color = "#000624" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 19V5M6 11l6-6 6 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon({ size = 16, color = "#000624" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 15V4M8 8l4-4 4 4M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoreIcon({ size = 16, color = "#000624" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="12" r="2" fill={color} />
      <circle cx="12" cy="12" r="2" fill={color} />
      <circle cx="19" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function PrinterIcon({ size = 16, color = "#000624" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 9V3h12v6M6 18H4.5A1.5 1.5 0 013 16.5v-5A1.5 1.5 0 014.5 10h15a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5H18"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="6" y="14" width="12" height="7" rx="1" stroke={color} strokeWidth={1.6} />
    </svg>
  );
}

export function BellIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 10.5a6 6 0 1112 0c0 3 1 4.6 1.8 5.4.4.4.1 1.1-.5 1.1H4.7c-.6 0-.9-.7-.5-1.1C5 15.1 6 13.5 6 10.5z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 19a2.5 2.5 0 005 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function MicIcon({ size = 28, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth={1.6} />
      <path
        d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M9 21h6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PauseIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="4" height="16" rx="1" fill={color} />
      <rect x="14" y="4" width="4" height="16" rx="1" fill={color} />
    </svg>
  );
}

export function PlayIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4.5v15l14-7.5-14-7.5z" fill={color} />
    </svg>
  );
}

// Matches the "volume-medium-sharp" icon used in the Dream Result
// "Reading" pill (Figma node 1613:17527) — speaker body + two sound-wave
// arcs, redrawn in this app's own stroke-based icon style instead of
// pixel-matching the Ionicons source.
export function VolumeIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9.5v5h4l5 4V5.5l-5 4H3z" fill={color} />
      <path
        d="M16.5 8.5a5 5 0 010 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon({ size = 18, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 20l.9-3.6a2 2 0 01.53-.94L16.2 4.7a1.6 1.6 0 012.26 0l.84.84a1.6 1.6 0 010 2.26L8.54 18.57a2 2 0 01-.94.53L4 20z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M14 6.6l3.4 3.4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function RepeatIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 12a8 8 0 0113.66-5.66M20 4v5h-5M20 12a8 8 0 01-13.66 5.66M4 20v-5h5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ActivityIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeartIcon({ size = 20, color = "#fff", filled = false }: { size?: number; color?: string; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      {/* fill-opacity (not the fill/none swap the old version used) so the
          transition below can actually animate — "none" isn't an
          interpolatable paint value, so toggling straight to/from it always
          hard-cuts regardless of any CSS transition. */}
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={color}
        fillOpacity={filled ? 1 : 0}
        style={{ transition: "fill-opacity 0.25s ease" }}
      />
    </svg>
  );
}

export function SettingsIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.6} />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BoltIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WaterDropIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2 12 2Z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlameIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5c1.2 2.4-0.6 3.8-1.6 5.2C9 9.4 8.5 11 9.3 12.4c-1.1-.5-1.9-1.7-1.9-3.1C5.7 10.9 5 13 5 14.8 5 18.8 8.1 22 12 22s7-3.2 7-7.2c0-2.6-1-5-2.8-6.8.2 1.6-.4 2.6-1.2 3.3-.1-3.2-1.3-6.1-3-6.8Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InfoIcon({ size = 16, color = "rgba(255,255,255,0.6)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={1.6} />
      <path d="M12 11v5M12 8v.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function TrendIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 7 22 7 22 13" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloudMoonIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 6a4 4 0 00-4 4H7a3 3 0 000 6h10a3 3 0 000-6h-.17A4 4 0 0013 6z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 3a3 3 0 01-3 3 3 3 0 003 3 3 3 0 000-6z" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SmileIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={1.6} />
      <path d="M8.5 14.5s1 2 3.5 2 3.5-2 3.5-2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" fill={color} />
      <circle cx="15" cy="10" r="1" fill={color} />
    </svg>
  );
}

export function LanguageAIcon({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 13.5L6.5 4l4.5 9.5M3.5 11h6" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 8c1.2 0 2.5 0 3.5 0M13 6.5v5M13 11.5c0 .8.7 1.5 1.5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UpDownChevronIcon({ size = 16, color = "rgba(255,255,255,0.5)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 6.5L8 3.5l3.5 3" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 9.5L8 12.5l3.5-3" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlarmIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="13" r="7.5" stroke={color} strokeWidth={1.6} />
      <path d="M12 10v3l2 2" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 4L4 6.5M17.5 4L20 6.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function GlobeIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={1.6} />
      <path d="M12 2.5C12 2.5 9 6.5 9 12s3 9.5 3 9.5M12 2.5C12 2.5 15 6.5 15 12s-3 9.5-3 9.5" stroke={color} strokeWidth={1.6} />
      <path d="M2.5 12h19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function DocumentIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function SaveIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NightmareIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={1.6} />
      <path d="M8.5 16.5s1-2 3.5-2 3.5 2 3.5 2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" fill={color} />
      <circle cx="15" cy="10" r="1" fill={color} />
    </svg>
  );
}

export function CheckmarkIcon({ size = 13, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6.5L5.2 10L11 3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Standard multi-color Google "G" mark — brand colors are fixed
// (this is the one place in the app a hardcoded palette is correct,
// since it's a third-party logo, not part of Lucid's own design system).
export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.87c2.27-2.09 3.58-5.17 3.58-8.8z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-2.98c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.25 21.3 7.31 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.3a7.19 7.19 0 010-4.6V6.61H1.27a12 12 0 000 10.78l4-3.09z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        fill="#EA4335"
      />
    </svg>
  );
}
