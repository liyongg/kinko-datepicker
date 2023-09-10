import { useRef, useEffect, useState } from "react";
import RenderDate from "./RenderDate";

export default function RenderDates({
  data,
  updateConnected,
  updateSubmitted,
}) {
  const [selectedDatesGroup, setSelectedDatesGroup] = useState(data);

  const handleSubmit = async function (e) {
    e.preventDefault();
    const response = await fetch("/api/submit/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedDatesGroup),
    });

    // Put modal here

    if (response.ok) {
      updateSubmitted(true);
      updateConnected(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <RenderDate
            data={data}
            property="filteredDates"
            title="Uitgezet"
            updateFun={setSelectedDatesGroup}
          />
          <RenderDate
            data={data}
            property="addedMondays"
            title="Aangezet"
            updateFun={setSelectedDatesGroup}
          />
        </div>
        <button>Opslaan</button>
      </form>
    </>
  );
}
