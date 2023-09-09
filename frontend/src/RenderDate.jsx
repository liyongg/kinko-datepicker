import { useRef, useEffect, useState } from "react";
import flatpickr from "flatpickr";

export default function RenderDate({ data, property, title, updateFun }) {
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
      onChange: function (selectedDates) {
        updateFun((currData) => {
          return {
            ...currData,
            [property]: selectedDates.map((date) => formatDateYMD(date)),
          };
        });
        setSelectedDatesComp(selectedDates);
      },
    });
  }, []);

  const formatDateYMD = function (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

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
      <input type="text" ref={datePickerRef} id={property} />
      <ul>
        {selectedDatesComp.map((date, idx) => (
          <li key={idx}>{formatDate(date)}</li>
        ))}
      </ul>
    </div>
  );
}
