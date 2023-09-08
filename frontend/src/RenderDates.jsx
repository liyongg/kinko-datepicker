import { useRef, useEffect, useState } from "react";

export default function RenderDates({ data, prop, title }) {
  const datePickerRef = useRef(null);

  useEffect(() => {
    flatpickr(datePickerRef.current, {
      enableTime: false,
      mode: "multiple",
      disable: [
        function (date) {
          if (prop === "filteredDates") {
            return date.getDay() === 1;
          } else {
            return date.getDay() !== 1;
          }
        },
      ],
      locale: {
        firstDayOfWeek: 1, // start week on Monday
      },
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "l j F, Y",
      defaultDate: data[prop],
    });
  }, []);

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
      <input type="text" ref={datePickerRef} />
    </div>
  );
}
