const Svg = ({ children, className = 'h-6 w-6', strokeWidth = 1.8, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const HomeIcon = (props) => (
  <Svg {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
  </Svg>
);

export const ClosetIcon = (props) => (
  <Svg {...props}>
    <rect x="3.5" y="3" width="17" height="18" rx="3" />
    <path d="M12 3v18" />
    <path d="M9 10h.01M15 10h.01" />
  </Svg>
);

export const BagIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 8h15l-1.2 12.5H5.7z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Svg>
);

export const SparkleIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3v4M12 17v4M4.5 12h4M15.5 12h4" />
    <path d="M12 7.5 13.6 11 17 12l-3.4 1L12 16.5 10.4 13 7 12l3.4-1z" />
  </Svg>
);

export const StarIcon = (props) => (
  <Svg {...props}>
    <path d="m12 3.5 2.6 5.3 5.9.8-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.6l5.9-.8z" />
  </Svg>
);

export const ClockIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const UserIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const CameraIcon = (props) => (
  <Svg {...props}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 8z" />
    <circle cx="12" cy="13" r="3.2" />
  </Svg>
);

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const ChevronRightIcon = (props) => (
  <Svg {...props}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const AlertIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </Svg>
);

export const SendIcon = (props) => (
  <Svg {...props}>
    <path d="M4 12 20 4l-8 16-2-6z" />
    <path d="m10 14 10-10" />
  </Svg>
);

export const ImageIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.5" cy="10" r="1.6" />
    <path d="m4 17 4.5-4.5L14 18" />
  </Svg>
);

export const FlameIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3s5 4.2 5 8.7a5 5 0 0 1-10 0C7 9.5 8.5 8 8.5 8s.5 2 1.8 2.2C11.4 10.4 12 7.4 12 3z" />
  </Svg>
);

export const PaletteIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.5-1.3-1.7-1.3-2.9 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.6-4-6.5-9-6.5z" />
    <circle cx="8" cy="10.5" r="1.1" />
    <circle cx="12" cy="8" r="1.1" />
  </Svg>
);

export const RefreshIcon = (props) => (
  <Svg {...props}>
    <path d="M20 11a8 8 0 1 0-2.3 6.3" />
    <path d="M20 5v6h-6" />
  </Svg>
);

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Svg>
);

export const LogoutIcon = (props) => (
  <Svg {...props}>
    <path d="M15 5H6a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 6 19h9" />
    <path d="M14 12h7m0 0-3-3m3 3-3 3" />
  </Svg>
);

export const ShirtIcon = ClosetIcon;
