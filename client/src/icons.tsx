import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps(size: number): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };
}

export function IconUpload({ size = 20, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path
        d="M12 4v12m0 0 4-4m-4 4-4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlay({ size = 20, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path d="M9 7v10l9-5-9-5Z" fill="currentColor" />
    </svg>
  );
}

export function IconPause({ size = 20, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path d="M8 6h3v12H8V6Zm5 0h3v12h-3V6Z" fill="currentColor" />
    </svg>
  );
}

export function IconExport({ size = 20, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path
        d="M12 4v10m0 0 3.5-3.5M12 14 8.5 10.5M6 17h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDropper({ size = 18, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path
        d="m5 17 6.5-6.5a3 3 0 0 0 0-4.24L13 5.76a3 3 0 0 0-4.24 0L5 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M4 20h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function IconSensitivity({ size = 18, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 5v2M12 17v2M5 12h2M17 12h2M7 7l1.5 1.5M15.5 15.5 17 17M7 17l1.5-1.5M15.5 8.5 17 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconFeather({ size = 18, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path
        d="M5 16c4-6 10-6 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M8 19h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconQuality({ size = 18, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path
        d="M7 4h10v6l-5 4-5-4V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 15v5h6v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconFilm({ size = 18, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path
        d="M5 7h14v10H5V7Zm3 0V5M16 7V5M8 17v2M16 17v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconInfo({ size = 16, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 10v6M12 8h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMirror({ size = 20, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <path
        d="M12 5v14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 9 4 12l4 3M16 9l4 3-4 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconScissors({ size = 18, ...p }: IconProps) {
  return (
    <svg {...baseProps(size)} {...p}>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
