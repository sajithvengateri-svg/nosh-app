import { format } from "date-fns";

interface PrepDayHeaderProps {
  date: Date;
}

export function PrepDayHeader({ date }: PrepDayHeaderProps) {
  return (
    <div className="text-center py-4">
      <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-widest uppercase text-foreground">
        {format(date, "EEEE")}
      </h2>
      <p className="text-lg text-muted-foreground font-mono tracking-wider mt-1">
        {format(date, "dd / MM / yyyy")}
      </p>
    </div>
  );
}
