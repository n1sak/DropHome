import { memo, type CSSProperties } from 'react';
import type { FurnitureArt } from './furnitureArt';
import type { P } from './sketch';

const isVar = (c?: string) => !!c && c.startsWith('var(');

/** Renders pen output. Colours given as CSS variables go through `style` so they follow the day/night theme. */
export const Paths = memo(function Paths({ paths }: { paths: P[] }) {
  return (
    <>
      {paths.map((p, i) => {
        const themed = isVar(p.fill) || isVar(p.stroke);
        return (
          <path
            key={i}
            d={p.d}
            fill={themed ? undefined : (p.fill ?? 'none')}
            stroke={themed ? undefined : (p.stroke ?? 'none')}
            style={themed ? { fill: p.fill ?? 'none', stroke: p.stroke ?? 'none' } : undefined}
            strokeWidth={p.sw}
            opacity={p.o}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </>
  );
});

export const SketchSvg = memo(function SketchSvg({ w, h, paths, className }: { w: number; h: number; paths: P[]; className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <Paths paths={paths} />
    </svg>
  );
});

/** A furniture drawing whose parts animate between closed and open via CSS variables (see .fpart in app.css). */
export const FurnitureSvg = memo(function FurnitureSvg({ w, h, art }: { w: number; h: number; art: FurnitureArt }) {
  return (
    <svg className="furn-svg" viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none" overflow="visible" aria-hidden="true" focusable="false">
      {art.parts.map((part) => {
        const style: Record<string, string | number> = {};
        if (part.closed) style['--ct'] = part.closed;
        if (part.open) style['--ot'] = part.open;
        if (part.closedOpacity !== undefined) style['--co'] = part.closedOpacity;
        if (part.openOpacity !== undefined) style['--oo'] = part.openOpacity;
        if (part.origin) style.transformOrigin = part.origin;
        if (part.delay) style.transitionDelay = `${part.delay}ms`;
        return (
          <g key={part.key} className={`fpart${part.cls ? ` ${part.cls}` : ''}`} style={style as CSSProperties}>
            <Paths paths={part.paths} />
          </g>
        );
      })}
    </svg>
  );
});
