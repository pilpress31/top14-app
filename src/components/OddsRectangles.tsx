interface OddsProps {
  home?: number;
  draw?: number;
  away?: number;
}

export function OddsRectangles({ home, draw, away }: OddsProps) {
  if (!home || !away) return null; // pas de cotes dispo

  return (
    <div className="flex justify-center gap-2 mt-2">
      <div className="bg-black/70 text-rugby-gold rounded-md px-3 py-1 text-xs font-bold shadow">
        1 {home}
      </div>
      {draw && (
        <div className="bg-black/70 text-rugby-gold rounded-md px-3 py-1 text-xs font-bold shadow">
          X {draw}
        </div>
      )}
      <div className="bg-black/70 text-rugby-gold rounded-md px-3 py-1 text-xs font-bold shadow">
        2 {away}
      </div>
    </div>
  );
}
