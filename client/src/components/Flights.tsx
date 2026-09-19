import { useLayoutEffect, useRef } from 'react';
import { useApp, type Flight } from '../store/store';
import { FileObject } from './FileObject';

interface Pt {
  x: number;
  y: number;
}

function centerOf(selector: string): Pt | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  const p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  return p.x < 0 || p.y < 40 || p.x > window.innerWidth || p.y > window.innerHeight ? null : p;
}

/** Files in the air: from the porch into a room, from a drawer to the bins. */
export function Flights() {
  const flights = useApp((s) => s.flights);
  return (
    <div className="flights" aria-hidden="true">
      {flights.map((f) => (
        <FlightView key={f.id} flight={f} />
      ))}
    </div>
  );
}

function FlightView({ flight }: { flight: Flight }) {
  const ref = useRef<HTMLDivElement>(null);
  const file = useApp((s) => s.files.find((f) => f.id === flight.fileId));

  useLayoutEffect(() => {
    const el = ref.current;
    const app = useApp.getState();
    const finish = () => {
      app.endFlight(flight.id);
      app.pulse(flight.to.roomId);
    };
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();

    const from =
      ('furnitureId' in flight.from ? centerOf(`[data-furniture-id="${flight.from.furnitureId}"]`) : { x: flight.from.rect.left + flight.from.rect.width / 2, y: flight.from.rect.top + flight.from.rect.height / 2 }) ??
      centerOf('.panel') ?? { x: window.innerWidth / 2, y: window.innerHeight - 80 };
    const to =
      centerOf(`[data-furniture-id="${flight.to.furnitureId}"]`) ??
      centerOf(`[data-room-id="${flight.to.roomId}"]`) ??
      centerOf(`[data-mini-room="${flight.to.roomId}"]`) ?? { x: window.innerWidth / 2, y: 70 };

    const lift = Math.min(from.y, to.y) - 90 - Math.abs(to.x - from.x) * 0.1;
    const mid = { x: (from.x + to.x) / 2, y: Math.max(70, lift) };
    const anim = el.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px) scale(0.5) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${from.x}px, ${from.y - 18}px) scale(1) rotate(-7deg)`, opacity: 1, offset: 0.12 },
        { transform: `translate(${mid.x}px, ${mid.y}px) scale(1.08) rotate(9deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${to.x}px, ${to.y}px) scale(0.3) rotate(0deg)`, opacity: 0.85 },
      ],
      { duration: 880, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' },
    );
    anim.onfinish = finish;
    return () => {
      anim.onfinish = null; // unmounting (or React strict mode's double mount) is not "arrived"
      anim.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!file) return null;
  return (
    <div className="flight" ref={ref}>
      <FileObject file={file} mini flat />
    </div>
  );
}
