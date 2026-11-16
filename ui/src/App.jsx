import { useEffect, useState } from "react";
import Page from "./layouts/Page.jsx";
import InitialDataContext from "./context/InitialDataContext.js";

export default function App({ initialData = null }) {
  const [snapshot, setSnapshot] = useState(initialData);

  useEffect(() => {
    // Discard bootstrap data so later visits fetch fresh data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(null);
  }, []);

  return (
    <InitialDataContext.Provider value={snapshot}>
      <Page initialUser={initialData?.user} />
    </InitialDataContext.Provider>
  );
}
