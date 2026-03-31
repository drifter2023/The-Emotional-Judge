import { useEffect, useState } from 'react';

interface GaugeProps {
  value: number;
  loading?: boolean;
}

function getColor(value: number): string {
  if (value <= 20) return '#22c55e';
  if (value <= 40) return '#eab308';
  if (value <= 60) return '#f97316';
  if (value <= 80) return '#ef4444';
  return '#991b1b';
}

export default function Gauge({ value, loading = false }: GaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (loading) {
      setAnimatedValue(50);
      return;
    }

    let start: number | null = null;
    const duration = 1200;
    const from = 0;
    const to = value;

    function animate(timestamp: number) {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(from + (to - from) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value, loading]);

  // SVG arc gauge from -135deg to 135deg (270deg sweep)
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = -225; // degrees, from top
  const endAngle = 45;
  const sweepAngle = endAngle - startAngle; // 270

  const needleAngle = startAngle + (animatedValue / 100) * sweepAngle;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = 60;
  const needleX = cx + needleLength * Math.cos(needleRad);
  const needleY = cy + needleLength * Math.sin(needleRad);

  const color = loading ? 'rgba(212, 168, 67, 0.5)' : getColor(animatedValue);

  // Arc path helper
  function describeArc(
    x: number,
    y: number,
    r: number,
    startDeg: number,
    endDeg: number
  ): string {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = x + r * Math.cos(startRad);
    const y1 = y + r * Math.sin(startRad);
    const x2 = x + r * Math.cos(endRad);
    const y2 = y + r * Math.sin(endRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Filled arc up to current value
  const filledEndAngle = startAngle + (animatedValue / 100) * sweepAngle;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 140" className="w-48 h-auto">
        {/* Background arc */}
        <path
          d={describeArc(cx, cy, radius, startAngle, endAngle)}
          fill="none"
          stroke="rgba(100, 116, 139, 0.2)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Filled arc */}
        {animatedValue > 0.5 && (
          <path
            d={describeArc(cx, cy, radius, startAngle, filledEndAngle)}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: loading ? 'none' : undefined,
            }}
          />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={loading ? 'rgba(212, 168, 67, 0.4)' : '#d4a843'}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill="#d4a843" />

        {/* Score text */}
        {!loading && (
          <text
            x={cx}
            y={cy + 30}
            textAnchor="middle"
            fill={color}
            fontSize="20"
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {Math.round(animatedValue)}
          </text>
        )}
      </svg>
    </div>
  );
}
