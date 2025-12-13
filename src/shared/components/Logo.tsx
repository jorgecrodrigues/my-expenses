interface LogoProps {
  loading?: boolean;
}

export default function Logo({ loading = false }: LogoProps) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {/* Wallet shape */}
      <g>
        <rect
          x="25"
          y="35"
          width="70"
          height="50"
          rx="5"
          fill="#3182CE"
          opacity="0.2"
        />
        <path
          d="M 25 45 L 25 75 Q 25 80 30 80 L 90 80 Q 95 80 95 75 L 95 45 Z"
          fill="#3182CE"
        />
        <rect x="75" y="52" width="15" height="16" rx="2" fill="#2C5282" />
        <circle cx="87" cy="60" r="2" fill="#E2E8F0" />
      </g>

      {/* Dollar sign with pulse animation */}
      <text
        x="50"
        y="50"
        fontSize="24"
        fontWeight="bold"
        fill="#48BB78"
        textAnchor="middle"
      >
        $
        {loading && (
          <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </text>

      {/* Three dots loading animation */}
      {loading && (
        <g>
          <circle cx="45" cy="95" r="3" fill="#3182CE">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="60" cy="95" r="3" fill="#3182CE">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="75" cy="95" r="3" fill="#3182CE">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}
    </svg>
  );
}
