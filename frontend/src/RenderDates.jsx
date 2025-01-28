import { useRef, useEffect, useState } from "react";
import RenderDate from "./RenderDate";
import ClipLoader from "react-spinners/ClipLoader";

export default function RenderDates({
  data,
  token,
  updateConnected,
  updateSubmitted,
}) {
  const [selectedDatesGroup, setSelectedDatesGroup] = useState(data);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async function (e) {
    e.preventDefault();
    setLoading(true);
    const response = await fetch("/api/submit/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify(selectedDatesGroup),
    });

    // Put modal here

    if (response.ok) {
      updateSubmitted(true);
      updateConnected(false);
    }
    setLoading(false);
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
        <button disabled={loading}>Opslaan</button>
        <div style={{ paddingTop: "10px" }}>
          {loading ? <ClipLoader size={30} color="white" /> : null}
        </div>
      </form>
    </>
  );
}
