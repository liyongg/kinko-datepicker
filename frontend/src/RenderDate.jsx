import { useRef, useEffect, useState } from "react";

export default function RenderDate({ data, property, title }) {
  const [selectedDatesComp, setSelectedDatesComp] = useState(data[property]);

  const datePickerRef = useRef(null);

  useEffect(() => {
    flatpickr(datePickerRef.current, {
      enableTime: false,
      mode: "multiple",
      disable: [
        function (date) {
          if (property === "filteredDates") {
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
      defaultDate: data[property],
      minDate: "today",
      onClose: function (selectedDates) {
        setSelectedDatesComp((dates) => selectedDates);
      },
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

  const dates = data[property];
  const dateList =
    dates && dates.map((date, idx) => <li key={idx}>{formatDate(date)}</li>);

  return (
    <div>
      <h2>{title}</h2>
      <ul>{dateList}</ul>
      <label htmlFor={property}>Selected</label>
      <input type="text" ref={datePickerRef} id={property}/>
      <h2>Geselecteerde datums</h2>
      <ul>
        {selectedDatesComp.map((date) => (
          <li> {formatDate(date)} </li>
        ))}
      </ul>
    </div>
  );
}
