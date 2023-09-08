export default function RenderDates({ data, prop, title }) {
  const formatDate = function (stringDate) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    const inputDate = new Date(stringDate);
    return inputDate.toLocaleDateString("nl-NL", options);
  };

  const dates = data[prop];
  const dateList =
    dates && dates.map((date, idx) => <li key={idx}>{formatDate(date)}</li>);

  return (
    <div>
      <h2>{title}</h2>
      <ul>{dateList}</ul>
    </div>
  );
}
