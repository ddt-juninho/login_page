
interface DragonEmblemProps {
  className?: string;
}

export default function DragonEmblem({ className = 'w-36 h-36' }: DragonEmblemProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mortal Kombat Dragon Logo"
    >
      <defs>
        <linearGradient id="mkFireGradient" x1="50%" y1="0%" x2="25%" y2="100%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="48%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <clipPath id="mkCircleClip">
          <circle cx="100" cy="100" r="90" />
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="94" fill="#09090b" />
      <circle cx="100" cy="100" r="90" fill="url(#mkFireGradient)" />

      <g clipPath="url(#mkCircleClip)" fill="#09090b">
        <path d="M 80 195 C 72 175, 42 175, 36 155 C 32 142, 42 135, 42 135 C 35 138, 30 148, 35 156 C 28 152, 27 140, 34 132 C 24 132, 18 122, 22 114 C 15 116, 10 112, 12 108 C 26 105, 32 88, 28 68 C 25 56, 22 50, 25 46 C 29 52, 35 55, 42 52 C 35 44, 38 32, 52 32 C 62 32, 68 35, 74 35 C 65 26, 54 22, 54 14 C 54 10, 58 8, 61 11 C 59 16, 68 22, 82 28 C 78 20, 82 12, 92 14 C 89 19, 92 25, 100 28 C 112 28, 122 33, 128 42 C 135 44, 140 50, 138 56 C 145 58, 152 63, 156 70 C 165 72, 170 78, 166 84 C 162 88, 156 86, 152 82 C 149 85, 144 85, 141 81 C 134 80, 124 72, 114 68 C 102 64, 96 68, 98 74 C 102 78, 116 82, 132 90 C 142 95, 150 94, 154 88 C 158 92, 156 100, 148 103 C 138 106, 122 98, 108 92 C 94 86, 84 92, 86 104 C 89 118, 112 124, 136 136 C 162 150, 174 174, 168 195 Z" />
        <path d="M 152 84 C 162 96, 162 118, 176 126 C 182 129, 188 128, 191 124 C 186 125, 181 124, 177 120 C 183 121, 188 117, 190 112 C 185 115, 179 115, 174 111 C 166 103, 166 90, 157 81 Z" />
      </g>

      <path
        d="M 96 52 C 103 46, 114 49, 120 56 C 111 55, 103 54, 96 52 Z"
        fill="#facc15"
      />

      <circle
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke="#09090b"
        strokeWidth="12"
      />
    </svg>
  );
}