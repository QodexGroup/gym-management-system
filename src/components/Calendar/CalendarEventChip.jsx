import { kindTokens, toneDot } from './calendarTokens';

/**
 * A single event chip as rendered inside a month cell.
 *
 * Only rendered at xl and up, where a cell is ~127px (1280px viewport, sidebar expanded)
 * or wider. That holds two pieces of information, not three: the chip shows the
 * time and the name, and the third value (capacity, or booking status) is a 6px dot.
 * The name is the flexible element so it shrinks last — giving it no flex is what
 * previously ellipsed "HIIT Blast" down to "H". Type tightens a step below 2xl to buy
 * the name a few more characters in the narrowest cells that still show chips.
 *
 * @param {{ event: Object, onClick?: (event: Object) => void }} props
 * @returns {JSX.Element}
 */
const CalendarEventChip = ({ event, onClick = null }) => {
  const tokens = kindTokens(event.kind);
  const dotTone = event.dot?.tone;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={event.chipTitle || event.title}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick(event);
      }}
      onKeyDown={(e) => {
        if (!onClick || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.stopPropagation();
        e.preventDefault();
        onClick(event);
      }}
      className={`flex items-center gap-1 overflow-hidden rounded border-l-2 px-1 py-0.5 text-[11px] leading-tight 2xl:gap-1.5 2xl:px-1.5 2xl:text-xs ${tokens.chip} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <span className="flex-none font-bold tabular-nums opacity-80">{event.timeLabel}</span>
      <span className="flex-1 min-w-0 truncate font-medium">{event.title}</span>
      {dotTone && <span className={`flex-none w-1.5 h-1.5 rounded-full ${toneDot(dotTone)}`} />}
    </div>
  );
};

export default CalendarEventChip;
