import { useEffect, useState } from "react";
import { fetchGradebook, fetchAttendance } from "../api/studentvue";

export default function Dashboard() {
  const [gradebook, setGradebook] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const g = await fetchGradebook();
        setGradebook(g);
        const a = await fetchAttendance();
        setAttendance(a);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err) return <p className="text-red-600 p-6">{String(err)}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Grades</h1>
      <pre className="bg-gray-100 p-3 rounded overflow-auto">
        {gradebook ? JSON.stringify(gradebook, null, 2) : "Loading…"}
      </pre>

      <h2 className="text-xl font-semibold mt-6 mb-2">Attendance</h2>
      <pre className="bg-gray-100 p-3 rounded overflow-auto">
        {attendance ? JSON.stringify(attendance, null, 2) : "Loading…"}
      </pre>
    </div>
  );
}
