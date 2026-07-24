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

// Figma: Dream App — Design System, node 1802:28459 ("fi-rr-add")
export function AddAIIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 0C9.62663 0 7.30655 0.703788 5.33316 2.02236C3.35977 3.34094 1.8217 5.21509 0.913451 7.4078C0.00519943 9.60051 -0.232441 12.0133 0.230582 14.3411C0.693605 16.6689 1.83649 18.8071 3.51472 20.4853C5.19295 22.1635 7.33115 23.3064 9.65892 23.7694C11.9867 24.2324 14.3995 23.9948 16.5922 23.0866C18.7849 22.1783 20.6591 20.6402 21.9776 18.6668C23.2962 16.6935 24 14.3734 24 12C23.9966 8.81846 22.7312 5.76821 20.4815 3.51852C18.2318 1.26883 15.1815 0.00344108 12 0V0ZM12 22C10.0222 22 8.08879 21.4135 6.4443 20.3147C4.79981 19.2159 3.51809 17.6541 2.76121 15.8268C2.00433 13.9996 1.8063 11.9889 2.19215 10.0491C2.578 8.10929 3.53041 6.32746 4.92894 4.92893C6.32746 3.53041 8.10929 2.578 10.0491 2.19215C11.9889 1.8063 13.9996 2.00433 15.8268 2.76121C17.6541 3.51808 19.2159 4.79981 20.3147 6.4443C21.4135 8.08879 22 10.0222 22 12C21.9971 14.6513 20.9426 17.1931 19.0679 19.0679C17.1931 20.9426 14.6513 21.9971 12 22V22ZM17 12C17 12.2652 16.8946 12.5196 16.7071 12.7071C16.5196 12.8946 16.2652 13 16 13H13V16C13 16.2652 12.8946 16.5196 12.7071 16.7071C12.5196 16.8946 12.2652 17 12 17C11.7348 17 11.4804 16.8946 11.2929 16.7071C11.1054 16.5196 11 16.2652 11 16V13H8.00001C7.73479 13 7.48044 12.8946 7.2929 12.7071C7.10536 12.5196 7.00001 12.2652 7.00001 12C7.00001 11.7348 7.10536 11.4804 7.2929 11.2929C7.48044 11.1054 7.73479 11 8.00001 11H11V8C11 7.73478 11.1054 7.48043 11.2929 7.29289C11.4804 7.10536 11.7348 7 12 7C12.2652 7 12.5196 7.10536 12.7071 7.29289C12.8946 7.48043 13 7.73478 13 8V11H16C16.2652 11 16.5196 11.1054 16.7071 11.2929C16.8946 11.4804 17 11.7348 17 12Z"
        fill={color}
      />
    </svg>
  );
}

// Figma: Dream App — Design System, node 1776:26522 ("fi-rr-chat-arrow-grow")
export function UserIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(4.9848, 3.9768)">
        <path
          d="M17.5139 0H14.4279C14.2301 4.22243e-05 14.0368 0.0587141 13.8724 0.168598C13.708 0.278483 13.5799 0.434646 13.5042 0.617346C13.4285 0.800045 13.4087 1.00108 13.4473 1.19503C13.4859 1.38898 13.5811 1.56715 13.7209 1.707L14.8069 2.793L11.2209 6.378C11.0304 6.5601 10.7769 6.66172 10.5134 6.66172C10.2498 6.66172 9.99642 6.5601 9.80589 6.378L9.63589 6.207C9.0645 5.66107 8.30465 5.35642 7.51439 5.35642C6.72412 5.35642 5.96427 5.66107 5.39289 6.207L0.292885 11.307C0.104979 11.4954 -0.000374075 11.7508 9.98059e-07 12.0169C0.000376071 12.283 0.106449 12.5381 0.294886 12.726C0.483322 12.9139 0.738686 13.0193 1.0048 13.0189C1.27091 13.0185 1.52598 12.9124 1.71389 12.724L6.81389 7.624C7.0043 7.44168 7.25775 7.3399 7.52139 7.3399C7.78502 7.3399 8.03847 7.44168 8.22889 7.624L8.39889 7.795C8.9705 8.34047 9.73027 8.64481 10.5204 8.64481C11.3105 8.64481 12.0703 8.34047 12.6419 7.795L16.2279 4.209L17.3139 5.295C17.4542 5.43255 17.6319 5.52571 17.8249 5.56285C18.0179 5.59999 18.2175 5.57945 18.3988 5.50382C18.5802 5.42818 18.7352 5.3008 18.8446 5.13756C18.954 4.97433 19.0129 4.78249 19.0139 4.586V1.5C19.0139 1.10218 18.8558 0.720645 18.5745 0.43934C18.2932 0.158035 17.9117 0 17.5139 0Z"
          fill={color}
        />
      </g>
      <path
        d="M23 21.976H5C4.20435 21.976 3.44129 21.6599 2.87868 21.0973C2.31607 20.5347 2 19.7716 2 18.976V1C2 0.734784 1.89464 0.48043 1.70711 0.292893C1.51957 0.105357 1.26522 0 1 0C0.734784 0 0.48043 0.105357 0.292893 0.292893C0.105357 0.48043 0 0.734784 0 1L0 18.976C0.00158786 20.3016 0.528882 21.5724 1.46622 22.5098C2.40356 23.4471 3.6744 23.9744 5 23.976H23C23.2652 23.976 23.5196 23.8706 23.7071 23.6831C23.8946 23.4956 24 23.2412 24 22.976C24 22.7108 23.8946 22.4564 23.7071 22.2689C23.5196 22.0814 23.2652 21.976 23 21.976Z"
        fill={color}
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

// Figma "Dream App — Design System", node 1775:26516 ("fi-rr-gallery") —
// used as the bottom nav's Gallery tab icon.
// Figma: Dream App — Design System, node 1776:26518 ("fi-rr-picture")
export function GalleryIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19 0H5C3.6744 0.00158786 2.40356 0.528882 1.46622 1.46622C0.528882 2.40356 0.00158786 3.6744 0 5L0 19C0.00158786 20.3256 0.528882 21.5964 1.46622 22.5338C2.40356 23.4711 3.6744 23.9984 5 24H19C20.3256 23.9984 21.5964 23.4711 22.5338 22.5338C23.4711 21.5964 23.9984 20.3256 24 19V5C23.9984 3.6744 23.4711 2.40356 22.5338 1.46622C21.5964 0.528882 20.3256 0.00158786 19 0V0ZM5 2H19C19.7956 2 20.5587 2.31607 21.1213 2.87868C21.6839 3.44129 22 4.20435 22 5V19C21.9983 19.4455 21.8957 19.8848 21.7 20.285L12.537 11.122C12.0727 10.6576 11.5214 10.2892 10.9147 10.0378C10.308 9.78644 9.65772 9.65707 9.001 9.65707C8.34428 9.65707 7.69399 9.78644 7.08728 10.0378C6.48056 10.2892 5.92931 10.6576 5.465 11.122L2 14.586V5C2 4.20435 2.31607 3.44129 2.87868 2.87868C3.44129 2.31607 4.20435 2 5 2V2ZM5 22C4.20435 22 3.44129 21.6839 2.87868 21.1213C2.31607 20.5587 2 19.7956 2 19V17.414L6.878 12.536C7.1566 12.2572 7.4874 12.0361 7.85151 11.8852C8.21561 11.7343 8.60587 11.6566 9 11.6566C9.39413 11.6566 9.78439 11.7343 10.1485 11.8852C10.5126 12.0361 10.8434 12.2572 11.122 12.536L20.285 21.7C19.8848 21.8957 19.4455 21.9983 19 22H5Z"
        fill={color}
      />
      <g transform="translate(12.5, 3.5)">
        <path
          d="M3.5 7C4.19224 7 4.86892 6.79473 5.4445 6.41015C6.02007 6.02556 6.46867 5.47894 6.73358 4.83939C6.99849 4.19985 7.0678 3.49612 6.93275 2.81719C6.7977 2.13825 6.46436 1.51461 5.97488 1.02513C5.48539 0.535644 4.86175 0.202301 4.18282 0.0672531C3.50388 -0.0677952 2.80015 0.00151649 2.16061 0.266423C1.52107 0.53133 0.974441 0.979934 0.589856 1.55551C0.205271 2.13108 0 2.80777 0 3.5C0 4.42826 0.368749 5.3185 1.02513 5.97488C1.6815 6.63125 2.57174 7 3.5 7V7ZM3.5 2C3.79667 2 4.08668 2.08798 4.33336 2.2528C4.58003 2.41762 4.77229 2.65189 4.88582 2.92598C4.99935 3.20007 5.02906 3.50167 4.97118 3.79264C4.9133 4.08361 4.77044 4.35088 4.56066 4.56066C4.35088 4.77044 4.08361 4.9133 3.79264 4.97118C3.50166 5.02906 3.20006 4.99935 2.92598 4.88582C2.65189 4.77229 2.41762 4.58003 2.2528 4.33336C2.08797 4.08668 2 3.79667 2 3.5C2 3.10218 2.15804 2.72065 2.43934 2.43934C2.72064 2.15804 3.10218 2 3.5 2V2Z"
          fill={color}
        />
      </g>
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
// Standard black Apple mark — same fixed-brand-color rationale as
// GoogleIcon above.
export function AppleIcon({ size = 18, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.365 1.43c0 1.14-.462 2.15-1.152 2.926-.795.9-2.05 1.596-3.086 1.51-.132-1.087.436-2.235 1.155-2.98C13.99.99 15.4.212 16.365 1.43zM20.02 17.24c-.53 1.222-.783 1.77-1.463 2.85-.947 1.51-2.283 3.39-3.94 3.404-1.472.014-1.852-.958-3.85-.947-1.996.012-2.415.964-3.888.95-1.657-.015-2.923-1.71-3.87-3.22-2.653-4.212-2.933-9.156-1.294-11.79 1.163-1.878 3-2.977 4.72-2.977 1.752 0 2.854 1.007 4.303 1.007 1.406 0 2.264-1.01 4.302-1.01 1.532 0 3.156.836 4.315 2.276-3.794 2.078-3.178 7.492.665 9.478z"
        fill={color}
      />
    </svg>
  );
}

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
