
import { useState, useEffect } from "react";

function App() {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/about")
      .then((response) => response.json())
      .then((data) => {
        setAbout(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("API Error:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>SyncSpace</h1>

      {loading && <p>Loading backend information...</p>}

      {about && (
        <div>
          <h2>Backend Information</h2>
          <p>Project: {about.project}</p>
          <p>Developer: {about.developer}</p>
          <p>Version: {about.version}</p>
        </div>
      )}
    </div>
  );
}

export default App;
