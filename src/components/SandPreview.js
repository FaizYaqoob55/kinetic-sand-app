// src/components/SandPreview.js
// Unique sand art SVG previews for every pattern — grayscale line art only
// Each shape is drawn as sand ball trails — realistic to what the table draws

import React from 'react';
import Svg, {
  Circle, Path, Line, Ellipse, Polyline, Polygon, G,
} from 'react-native-svg';

const C  = '#686878'; // main stroke color
const C2 = '#484858'; // secondary
const C3 = '#383848'; // tertiary / faint lines

// ─── INDIVIDUAL SHAPE RENDERERS ───────────────────────────────────────────────

const WhaleShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  return (
    <G>
      {/* Body */}
      <Ellipse cx={cx - s*0.05} cy={cy} rx={s*0.30} ry={s*0.17} fill="none" stroke={C} strokeWidth="1.4"/>
      {/* Tail flukes */}
      <Path d={`M${cx+s*0.22},${cy} Q${cx+s*0.38},${cy-s*0.14} ${cx+s*0.42},${cy-s*0.06} Q${cx+s*0.35},${cy} ${cx+s*0.22},${cy} Q${cx+s*0.35},${cy} ${cx+s*0.42},${cy+s*0.06} Q${cx+s*0.38},${cy+s*0.14} ${cx+s*0.22},${cy} Z`} fill="none" stroke={C} strokeWidth="1.4"/>
      {/* Dorsal fin */}
      <Path d={`M${cx-s*0.02},${cy-s*0.17} Q${cx+s*0.06},${cy-s*0.30} ${cx+s*0.12},${cy-s*0.17}`} fill="none" stroke={C} strokeWidth="1.2"/>
      {/* Pectoral fin */}
      <Path d={`M${cx-s*0.10},${cy+s*0.05} Q${cx-s*0.06},${cy+s*0.22} ${cx+s*0.04},${cy+s*0.14} Q${cx-s*0.02},${cy+s*0.08} ${cx-s*0.10},${cy+s*0.05} Z`} fill="none" stroke={C} strokeWidth="1.1"/>
      {/* Eye */}
      <Circle cx={cx-s*0.20} cy={cy-s*0.03} r={s*0.02} fill={C}/>
      {/* Body texture lines */}
      <Path d={`M${cx-s*0.28},${cy+s*0.08} Q${cx},${cy+s*0.20} ${cx+s*0.18},${cy+s*0.08}`} fill="none" stroke={C3} strokeWidth="0.8"/>
      <Path d={`M${cx-s*0.26},${cy+s*0.12} Q${cx},${cy+s*0.22} ${cx+s*0.16},${cy+s*0.12}`} fill="none" stroke={C3} strokeWidth="0.7"/>
    </G>
  );
};

const FractalTreeShape = ({ s }) => {
  const cx = s / 2;
  const drawBranch = (x1, y1, angle, length, depth) => {
    if (depth === 0 || length < 2) return null;
    const x2 = x1 + length * Math.sin((angle * Math.PI) / 180);
    const y2 = y1 - length * Math.cos((angle * Math.PI) / 180);
    const sw = depth * 0.5;
    return (
      <G key={`${x1}-${y1}-${depth}`}>
        <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C} strokeWidth={sw} opacity={0.4 + depth * 0.12}/>
        {drawBranch(x2, y2, angle - 25, length * 0.68, depth - 1)}
        {drawBranch(x2, y2, angle + 25, length * 0.68, depth - 1)}
      </G>
    );
  };
  return (
    <G>
      {drawBranch(cx, s * 0.92, 0, s * 0.28, 6)}
    </G>
  );
};

const FishShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  return (
    <G>
      {/* Body */}
      <Ellipse cx={cx-s*0.04} cy={cy} rx={s*0.26} ry={s*0.15} fill="none" stroke={C} strokeWidth="1.4"/>
      {/* Tail */}
      <Path d={`M${cx+s*0.20},${cy} L${cx+s*0.40},${cy-s*0.16} L${cx+s*0.42},${cy} L${cx+s*0.40},${cy+s*0.16} Z`} fill="none" stroke={C} strokeWidth="1.3"/>
      {/* Dorsal fin */}
      <Path d={`M${cx-s*0.08},${cy-s*0.15} Q${cx+s*0.04},${cy-s*0.26} ${cx+s*0.12},${cy-s*0.15}`} fill="none" stroke={C} strokeWidth="1.1"/>
      {/* Pectoral fin */}
      <Path d={`M${cx-s*0.06},${cy+s*0.04} L${cx+s*0.04},${cy+s*0.18} L${cx+s*0.12},${cy+s*0.08}`} fill="none" stroke={C} strokeWidth="1"/>
      {/* Eye */}
      <Circle cx={cx-s*0.17} cy={cy-s*0.02} r={s*0.03} fill="none" stroke={C} strokeWidth="1.2"/>
      <Circle cx={cx-s*0.17} cy={cy-s*0.02} r={s*0.01} fill={C}/>
      {/* Scales */}
      <Path d={`M${cx-s*0.10},${cy-s*0.08} Q${cx-s*0.04},${cy-s*0.14} ${cx+s*0.02},${cy-s*0.08}`} fill="none" stroke={C3} strokeWidth="0.7"/>
      <Path d={`M${cx+s*0.02},${cy-s*0.08} Q${cx+s*0.08},${cy-s*0.14} ${cx+s*0.14},${cy-s*0.08}`} fill="none" stroke={C3} strokeWidth="0.7"/>
      <Path d={`M${cx-s*0.08},${cy+s*0.08} Q${cx-s*0.02},${cy+s*0.14} ${cx+s*0.04},${cy+s*0.08}`} fill="none" stroke={C3} strokeWidth="0.7"/>
    </G>
  );
};

const MandalaShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const petals = 8;
  const petalPaths = Array.from({ length: petals }).map((_, i) => {
    const angle = (i / petals) * 360;
    const rad   = (angle * Math.PI) / 180;
    const r1    = s * 0.18, r2 = s * 0.36;
    const x1    = cx + r1 * Math.cos(rad);
    const y1    = cy + r1 * Math.sin(rad);
    const x2    = cx + r2 * Math.cos(rad);
    const y2    = cy + r2 * Math.sin(rad);
    const perp  = rad + Math.PI / 2;
    const bulge = s * 0.08;
    const mx    = (x1 + x2) / 2 + bulge * Math.cos(perp);
    const my    = (y1 + y2) / 2 + bulge * Math.sin(perp);
    return <Path key={i} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2} Q${mx - 2*bulge*Math.cos(perp)},${my - 2*bulge*Math.sin(perp)} ${x1},${y1} Z`} fill="none" stroke={C} strokeWidth="1.1"/>;
  });
  return (
    <G>
      {[s*0.40, s*0.30, s*0.20, s*0.10].map(r => (
        <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={C2} strokeWidth="0.9" opacity="0.5"/>
      ))}
      {petalPaths}
      <Circle cx={cx} cy={cy} r={s*0.06} fill="none" stroke={C} strokeWidth="1.2"/>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Line key={i} x1={cx} y1={cy} x2={cx + s*0.40*Math.cos(a)} y2={cy + s*0.40*Math.sin(a)} stroke={C3} strokeWidth="0.6" opacity="0.35"/>;
      })}
    </G>
  );
};

const SpiralShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const points = [];
  for (let i = 0; i <= 720; i += 6) {
    const t = (i * Math.PI) / 180;
    const r = (t / (4 * Math.PI)) * s * 0.42;
    points.push(`${cx + r * Math.cos(t)},${cy + r * Math.sin(t)}`);
  }
  return (
    <G>
      <Path d={`M${points.join(' L')}`} fill="none" stroke={C} strokeWidth="1.3"/>
    </G>
  );
};

const StarShape = ({ s, points = 5 }) => {
  const cx = s / 2, cy = s / 2;
  const outer = s * 0.40, inner = s * 0.18;
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r   = i % 2 === 0 ? outer : inner;
    const ang = (i * Math.PI) / points - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`);
  }
  return (
    <G>
      <Polygon points={pts.join(' ')} fill="none" stroke={C} strokeWidth="1.4"/>
      <Circle cx={cx} cy={cy} r={inner * 0.5} fill="none" stroke={C2} strokeWidth="1"/>
    </G>
  );
};

const ButterflyShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  return (
    <G>
      {/* Upper wings */}
      <Path d={`M${cx},${cy} Q${cx-s*0.38},${cy-s*0.38} ${cx-s*0.18},${cy-s*0.04}`} fill="none" stroke={C} strokeWidth="1.3"/>
      <Path d={`M${cx},${cy} Q${cx+s*0.38},${cy-s*0.38} ${cx+s*0.18},${cy-s*0.04}`} fill="none" stroke={C} strokeWidth="1.3"/>
      {/* Lower wings */}
      <Path d={`M${cx},${cy} Q${cx-s*0.30},${cy+s*0.30} ${cx-s*0.12},${cy+s*0.10}`} fill="none" stroke={C} strokeWidth="1.2"/>
      <Path d={`M${cx},${cy} Q${cx+s*0.30},${cy+s*0.30} ${cx+s*0.12},${cy+s*0.10}`} fill="none" stroke={C} strokeWidth="1.2"/>
      {/* Wing inner detail */}
      <Path d={`M${cx-s*0.06},${cy-s*0.06} Q${cx-s*0.24},${cy-s*0.22} ${cx-s*0.14},${cy-s*0.02}`} fill="none" stroke={C3} strokeWidth="0.8"/>
      <Path d={`M${cx+s*0.06},${cy-s*0.06} Q${cx+s*0.24},${cy-s*0.22} ${cx+s*0.14},${cy-s*0.02}`} fill="none" stroke={C3} strokeWidth="0.8"/>
      {/* Body */}
      <Ellipse cx={cx} cy={cy} rx={s*0.025} ry={s*0.14} fill="none" stroke={C} strokeWidth="1.2"/>
      {/* Antennae */}
      <Path d={`M${cx},${cy-s*0.14} Q${cx-s*0.08},${cy-s*0.30} ${cx-s*0.10},${cy-s*0.36}`} fill="none" stroke={C2} strokeWidth="0.9"/>
      <Path d={`M${cx},${cy-s*0.14} Q${cx+s*0.08},${cy-s*0.30} ${cx+s*0.10},${cy-s*0.36}`} fill="none" stroke={C2} strokeWidth="0.9"/>
      <Circle cx={cx-s*0.10} cy={cy-s*0.36} r={s*0.02} fill={C2}/>
      <Circle cx={cx+s*0.10} cy={cy-s*0.36} r={s*0.02} fill={C2}/>
    </G>
  );
};

const SnowflakeShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const arms = 6;
  return (
    <G>
      {Array.from({ length: arms }).map((_, i) => {
        const angle = (i / arms) * Math.PI * 2;
        const ex = cx + s * 0.40 * Math.cos(angle);
        const ey = cy + s * 0.40 * Math.sin(angle);
        const mx = cx + s * 0.22 * Math.cos(angle);
        const my = cy + s * 0.22 * Math.sin(angle);
        const perpAngle = angle + Math.PI / 2;
        return (
          <G key={i}>
            <Line x1={cx} y1={cy} x2={ex} y2={ey} stroke={C} strokeWidth="1.3"/>
            <Line x1={mx + s*0.10*Math.cos(perpAngle)} y1={my + s*0.10*Math.sin(perpAngle)} x2={mx - s*0.10*Math.cos(perpAngle)} y2={my - s*0.10*Math.sin(perpAngle)} stroke={C} strokeWidth="1.1"/>
            <Line x1={cx + s*0.30*Math.cos(angle) + s*0.07*Math.cos(perpAngle)} y1={cy + s*0.30*Math.sin(angle) + s*0.07*Math.sin(perpAngle)} x2={cx + s*0.30*Math.cos(angle) - s*0.07*Math.cos(perpAngle)} y2={cy + s*0.30*Math.sin(angle) - s*0.07*Math.sin(perpAngle)} stroke={C2} strokeWidth="0.9"/>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={s*0.05} fill="none" stroke={C} strokeWidth="1.2"/>
    </G>
  );
};

const NautilusShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const pts = [];
  for (let i = 0; i <= 540; i += 4) {
    const t = (i * Math.PI) / 180;
    const r = s * 0.06 * Math.exp(0.17 * t);
    if (r > s * 0.45) break;
    pts.push(`${cx + r * Math.cos(t)},${cy + r * Math.sin(t)}`);
  }
  return (
    <G>
      <Path d={`M${pts.join(' L')}`} fill="none" stroke={C} strokeWidth="1.3"/>
      {/* Chamber lines */}
      {[60, 120, 180, 240, 300, 360, 420, 480].map((deg, i) => {
        const t  = (deg * Math.PI) / 180;
        const r  = s * 0.06 * Math.exp(0.17 * t);
        if (r > s * 0.45) return null;
        return <Line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(t)} y2={cy + r * Math.sin(t)} stroke={C3} strokeWidth="0.7" opacity="0.5"/>;
      })}
    </G>
  );
};

const EagleShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  return (
    <G>
      {/* Left wing */}
      <Path d={`M${cx},${cy} Q${cx-s*0.36},${cy-s*0.18} ${cx-s*0.44},${cy+s*0.04} Q${cx-s*0.30},${cy+s*0.06} ${cx-s*0.14},${cy+s*0.10} Q${cx-s*0.06},${cy+s*0.04} ${cx},${cy} Z`} fill="none" stroke={C} strokeWidth="1.3"/>
      {/* Right wing */}
      <Path d={`M${cx},${cy} Q${cx+s*0.36},${cy-s*0.18} ${cx+s*0.44},${cy+s*0.04} Q${cx+s*0.30},${cy+s*0.06} ${cx+s*0.14},${cy+s*0.10} Q${cx+s*0.06},${cy+s*0.04} ${cx},${cy} Z`} fill="none" stroke={C} strokeWidth="1.3"/>
      {/* Wing feather detail */}
      {[-0.30,-0.22,-0.14].map((offset, i) => (
        <Line key={i} x1={cx+offset*s} y1={cy+s*0.02} x2={cx+(offset-0.06)*s} y2={cy+s*0.16} stroke={C2} strokeWidth="0.9"/>
      ))}
      {[0.30,0.22,0.14].map((offset, i) => (
        <Line key={i} x1={cx+offset*s} y1={cy+s*0.02} x2={cx+(offset+0.06)*s} y2={cy+s*0.16} stroke={C2} strokeWidth="0.9"/>
      ))}
      {/* Body */}
      <Ellipse cx={cx} cy={cy+s*0.06} rx={s*0.07} ry={s*0.14} fill="none" stroke={C} strokeWidth="1.2"/>
      {/* Head */}
      <Circle cx={cx} cy={cy-s*0.12} r={s*0.07} fill="none" stroke={C} strokeWidth="1.2"/>
      {/* Beak */}
      <Path d={`M${cx+s*0.06},${cy-s*0.10} L${cx+s*0.14},${cy-s*0.08} L${cx+s*0.06},${cy-s*0.06}`} fill="none" stroke={C} strokeWidth="1.1"/>
    </G>
  );
};

const KoiShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  return (
    <G>
      {/* Yin yang outer circle */}
      <Circle cx={cx} cy={cy} r={s*0.40} fill="none" stroke={C} strokeWidth="1.3"/>
      {/* S-curve divider */}
      <Path d={`M${cx},${cy-s*0.40} Q${cx+s*0.20},${cy-s*0.20} ${cx},${cy} Q${cx-s*0.20},${cy+s*0.20} ${cx},${cy+s*0.40}`} fill="none" stroke={C} strokeWidth="1.3"/>
      {/* Small circles */}
      <Circle cx={cx} cy={cy-s*0.20} r={s*0.08} fill="none" stroke={C} strokeWidth="1.1"/>
      <Circle cx={cx} cy={cy+s*0.20} r={s*0.08} fill="none" stroke={C} strokeWidth="1.1"/>
      {/* Fish eye details */}
      <Circle cx={cx} cy={cy-s*0.20} r={s*0.03} fill={C}/>
      <Circle cx={cx} cy={cy+s*0.20} r={s*0.03} fill="none" stroke={C} strokeWidth="1"/>
    </G>
  );
};

const HexagonShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const hexPath = (r) => {
    const pts = Array.from({ length: 6 }).map((_, i) => {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    });
    return `M${pts.join(' L')} Z`;
  };
  return (
    <G>
      {[s*0.40, s*0.28, s*0.16].map(r => (
        <Path key={r} d={hexPath(r)} fill="none" stroke={C} strokeWidth="1.2"/>
      ))}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        return <Line key={i} x1={cx + s*0.16*Math.cos(a)} y1={cy + s*0.16*Math.sin(a)} x2={cx + s*0.40*Math.cos(a)} y2={cy + s*0.40*Math.sin(a)} stroke={C2} strokeWidth="0.8" opacity="0.5"/>;
      })}
    </G>
  );
};

const LabyrinthShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  return (
    <G>
      {[s*0.40, s*0.32, s*0.24, s*0.16, s*0.08].map((r, i) => (
        <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth="1.1"
          strokeDasharray={i % 2 === 0 ? `${r * 1.2} ${r * 0.4}` : `${r * 0.8} ${r * 0.6}`}/>
      ))}
    </G>
  );
};

const LissajousShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const a = 3, b = 2;
  const pts = [];
  for (let i = 0; i <= 360; i += 3) {
    const t = (i * Math.PI) / 180;
    const x = cx + s * 0.38 * Math.sin(a * t + Math.PI / 4);
    const y = cy + s * 0.38 * Math.sin(b * t);
    pts.push(`${x},${y}`);
  }
  return (
    <G>
      <Path d={`M${pts.join(' L')}`} fill="none" stroke={C} strokeWidth="1.3"/>
    </G>
  );
};

const VoronoiShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  // Hardcoded Voronoi-like cell pattern
  return (
    <G>
      <Path d={`M${cx},${cy-s*0.38} L${cx+s*0.22},${cy-s*0.20} L${cx+s*0.38},${cy+s*0.08} L${cx+s*0.10},${cy+s*0.38} L${cx-s*0.28},${cy+s*0.28} L${cx-s*0.38},${cy-s*0.10} Z`} fill="none" stroke={C} strokeWidth="1.2"/>
      <Path d={`M${cx},${cy-s*0.38} L${cx-s*0.28},${cy-s*0.18} L${cx-s*0.38},${cy-s*0.10}`} fill="none" stroke={C} strokeWidth="1.1"/>
      <Path d={`M${cx+s*0.22},${cy-s*0.20} L${cx+s*0.04},${cy+s*0.06} L${cx+s*0.38},${cy+s*0.08}`} fill="none" stroke={C} strokeWidth="1.1"/>
      <Path d={`M${cx-s*0.28},${cy-s*0.18} L${cx+s*0.04},${cy+s*0.06} L${cx-s*0.28},${cy+s*0.28}`} fill="none" stroke={C} strokeWidth="1.1"/>
      <Path d={`M${cx+s*0.04},${cy+s*0.06} L${cx+s*0.10},${cy+s*0.38}`} fill="none" stroke={C} strokeWidth="1.1"/>
      <Circle cx={cx+s*0.04} cy={cy+s*0.06} r={s*0.02} fill={C2}/>
      <Circle cx={cx+s*0.22} cy={cy-s*0.20} r={s*0.02} fill={C2}/>
      <Circle cx={cx-s*0.28} cy={cy-s*0.18} r={s*0.02} fill={C2}/>
    </G>
  );
};

const ZenCircleShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  return (
    <G>
      {/* Concentric circles with gap — zen rake style */}
      {[s*0.40, s*0.34, s*0.28, s*0.22, s*0.16, s*0.10, s*0.04].map(r => (
        <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth="1"/>
      ))}
    </G>
  );
};

const GalaxyShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const arm = (startAngle) => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = (i * Math.PI) / 180;
      const r = s * 0.04 * Math.exp(0.065 * (t * 3 + startAngle));
      if (r > s * 0.46) break;
      pts.push(`${cx + r * Math.cos(t * 3 + startAngle)},${cy + r * Math.sin(t * 3 + startAngle)}`);
    }
    return pts;
  };
  const arm1 = arm(0);
  const arm2 = arm(Math.PI);
  return (
    <G>
      <Path d={`M${arm1.join(' L')}`} fill="none" stroke={C} strokeWidth="1.3"/>
      <Path d={`M${arm2.join(' L')}`} fill="none" stroke={C} strokeWidth="1.3"/>
      <Circle cx={cx} cy={cy} r={s*0.06} fill="none" stroke={C} strokeWidth="1.4"/>
      <Circle cx={cx} cy={cy} r={s*0.02} fill={C}/>
    </G>
  );
};

const SierpinskiShape = ({ s }) => {
  const cx = s / 2, cy = s * 0.85;
  const h  = s * 0.78;
  return (
    <G>
      {/* Outer triangle */}
      <Path d={`M${cx},${cy-h} L${cx+h*0.577},${cy} L${cx-h*0.577},${cy} Z`} fill="none" stroke={C} strokeWidth="1.3"/>
      {/* Mid triangles */}
      {[
        [cx, cy-h/2, h/2],
        [cx+h*0.288, cy-h/4, h/2],
        [cx-h*0.288, cy-h/4, h/2],
      ].map(([x, y, size], i) => (
        <Path key={i} d={`M${x},${y-size*0.5} L${x+size*0.288},${y+size*0.25} L${x-size*0.288},${y+size*0.25} Z`} fill="none" stroke={C2} strokeWidth="1"/>
      ))}
    </G>
  );
};

const MazePath = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  // Concentric arcs with gaps — circular maze look
  return (
    <G>
      <Circle cx={cx} cy={cy} r={s*0.38} fill="none" stroke={C} strokeWidth="1.2" strokeDasharray={`${s*0.60} ${s*0.22}`}/>
      <Circle cx={cx} cy={cy} r={s*0.28} fill="none" stroke={C} strokeWidth="1.2" strokeDasharray={`${s*0.40} ${s*0.22}`} strokeDashoffset={s*0.30}/>
      <Circle cx={cx} cy={cy} r={s*0.18} fill="none" stroke={C} strokeWidth="1.2" strokeDasharray={`${s*0.24} ${s*0.20}`}/>
      <Circle cx={cx} cy={cy} r={s*0.08} fill="none" stroke={C} strokeWidth="1.2"/>
      {/* Connecting paths */}
      <Line x1={cx+s*0.28} y1={cy} x2={cx+s*0.38} y2={cy} stroke={C} strokeWidth="1.2"/>
      <Line x1={cx} y1={cy-s*0.18} x2={cx} y2={cy-s*0.28} stroke={C} strokeWidth="1.2"/>
      <Line x1={cx-s*0.18} y1={cy} x2={cx-s*0.28} y2={cy} stroke={C} strokeWidth="1.2"/>
    </G>
  );
};

const PeacockShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const feathers = 8;
  return (
    <G>
      {Array.from({ length: feathers }).map((_, i) => {
        const angle = (i / feathers) * Math.PI * 2 - Math.PI / 2;
        const ex = cx + s*0.38 * Math.cos(angle);
        const ey = cy + s*0.38 * Math.sin(angle);
        const mx = cx + s*0.26 * Math.cos(angle);
        const my = cy + s*0.26 * Math.sin(angle);
        const pAngle = angle + Math.PI / 2;
        return (
          <G key={i}>
            <Line x1={cx} y1={cy} x2={ex} y2={ey} stroke={C} strokeWidth="1.1"/>
            <Ellipse
              cx={mx} cy={my}
              rx={s*0.06} ry={s*0.10}
              fill="none" stroke={C2} strokeWidth="1"
              rotation={`${(angle * 180) / Math.PI + 90}`}
              origin={`${mx},${my}`}
            />
            <Circle cx={ex} cy={ey} r={s*0.05} fill="none" stroke={C} strokeWidth="1.1"/>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={s*0.08} fill="none" stroke={C} strokeWidth="1.3"/>
    </G>
  );
};

const FlowerOfLifeShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const r = s * 0.18;
  const centers = [
    [cx, cy],
    ...Array.from({ length: 6 }).map((_, i) => {
      const a = (i * Math.PI) / 3;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }),
  ];
  return (
    <G>
      {centers.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="none" stroke={C} strokeWidth="1.1" opacity="0.75"/>
      ))}
      <Circle cx={cx} cy={cy} r={r * 2} fill="none" stroke={C2} strokeWidth="1" opacity="0.5"/>
    </G>
  );
};

const WaveShape = ({ s }) => {
  const cy = s / 2;
  const waves = [-s*0.16, -s*0.06, s*0.04, s*0.14];
  return (
    <G>
      {waves.map((offset, i) => (
        <Path
          key={i}
          d={`M${s*0.04},${cy+offset} Q${s*0.27},${cy+offset-s*0.16} ${s*0.50},${cy+offset} Q${s*0.73},${cy+offset+s*0.16} ${s*0.96},${cy+offset}`}
          fill="none" stroke={C} strokeWidth="1.2" opacity={1 - i * 0.18}
        />
      ))}
    </G>
  );
};

const YinYangShape = ({ s }) => {
  const cx = s / 2, cy = s / 2, r = s * 0.38;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth="1.3"/>
      <Path d={`M${cx},${cy-r} A${r/2},${r/2} 0 0,1 ${cx},${cy} A${r/2},${r/2} 0 0,0 ${cx},${cy+r} A${r},${r} 0 0,1 ${cx},${cy-r} Z`} fill="none" stroke={C} strokeWidth="1.2"/>
      <Circle cx={cx} cy={cy-r/2} r={r/6} fill="none" stroke={C} strokeWidth="1.1"/>
      <Circle cx={cx} cy={cy+r/2} r={r/6} fill="none" stroke={C2} strokeWidth="1.1"/>
    </G>
  );
};

const EpicycloidShape = ({ s }) => {
  const cx = s / 2, cy = s / 2;
  const R = s * 0.26, r = s * 0.13;
  const pts = [];
  for (let i = 0; i <= 720; i += 3) {
    const t = (i * Math.PI) / 180;
    const x = cx + (R + r) * Math.cos(t) - r * Math.cos(((R + r) / r) * t);
    const y = cy + (R + r) * Math.sin(t) - r * Math.sin(((R + r) / r) * t);
    pts.push(`${x},${y}`);
  }
  return (
    <G>
      <Path d={`M${pts.join(' L')}`} fill="none" stroke={C} strokeWidth="1.2"/>
    </G>
  );
};

// ── PATTERN ID → SHAPE MAP ────────────────────────────────────────────────────
const shapeForId = (id) => {
  if (id === 'a001' || id === 'f002') return 'whale';
  if (id === 'fr001')                 return 'sierpinski';
  if (id === 'a002')                  return 'eagle';
  if (id === 'a003')                  return 'fish';
  if (id === 'a004')                  return 'koi';
  if (id === 'a005')                  return 'butterfly';
  if (id === 'a006')                  return 'peacock';
  if (id.startsWith('m'))             return 'mandala';
  if (id.startsWith('mz'))            return 'maze';
  if (id.startsWith('fr'))            return 'sierpinski';
  if (id === 'g006')                  return 'floweroflife';
  if (id.startsWith('g'))             return 'hexagon';
  if (id === 'n002' || id === 'fr002') return 'snowflake';
  if (id === 'n005')                  return 'nautilus';
  if (id === 'n001')                  return 'tree';
  if (id === 'n003' || id === 'n008') return 'spiral';
  if (id.startsWith('n'))             return 'wave';
  if (id === 's001' || id === 'f008') return 'galaxy';
  if (id.startsWith('s'))             return 'star';
  if (id === 'z003')                  return 'yinyang';
  if (id === 'ab005')                 return 'voronoi';
  if (id === 'ab001' || id === 'ab002') return 'lissajous';
  if (id === 'ab003' || id === 'ab004') return 'epicycloid';
  if (id.startsWith('z'))             return 'zen';
  if (id.startsWith('f'))             return 'spiral';
  if (id.startsWith('ab'))            return 'lissajous';
  return 'mandala';
};

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export const SandPreview = ({ patternId, size = 80 }) => {
  const shape = shapeForId(patternId);
  const s     = size;

  const shapeMap = {
    whale:       <WhaleShape s={s} />,
    tree:        <FractalTreeShape s={s} />,
    fish:        <FishShape s={s} />,
    mandala:     <MandalaShape s={s} />,
    spiral:      <SpiralShape s={s} />,
    star:        <StarShape s={s} />,
    butterfly:   <ButterflyShape s={s} />,
    snowflake:   <SnowflakeShape s={s} />,
    nautilus:    <NautilusShape s={s} />,
    eagle:       <EagleShape s={s} />,
    koi:         <KoiShape s={s} />,
    hexagon:     <HexagonShape s={s} />,
    labyrinth:   <LabyrinthShape s={s} />,
    lissajous:   <LissajousShape s={s} />,
    voronoi:     <VoronoiShape s={s} />,
    zen:         <ZenCircleShape s={s} />,
    galaxy:      <GalaxyShape s={s} />,
    sierpinski:  <SierpinskiShape s={s} />,
    maze:        <MazePath s={s} />,
    peacock:     <PeacockShape s={s} />,
    floweroflife:<FlowerOfLifeShape s={s} />,
    wave:        <WaveShape s={s} />,
    yinyang:     <YinYangShape s={s} />,
    epicycloid:  <EpicycloidShape s={s} />,
  };

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {shapeMap[shape] || shapeMap.mandala}
    </Svg>
  );
};

export default SandPreview;
