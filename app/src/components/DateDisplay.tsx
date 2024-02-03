type DateDisplayProps = {
  date: Date;
};
export const DateDisplay = ({ date }: DateDisplayProps) => {
  console.log(date);
  const dateString = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeString = date.toLocaleTimeString('en-US', {
    dayPeriod: undefined,
    hour: 'numeric',
    minute: 'numeric',
    second: undefined,
  });
  console.log(dateString, timeString);
  return (
    <span>
      {dateString} @ {timeString}
    </span>
  );
};
