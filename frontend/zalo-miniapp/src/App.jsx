import { useEffect, useState } from "react";
import { getToken } from "./lib/auth";
import { appPath, parseRoute } from "./lib/routing";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Track from "./pages/Track.jsx";

export default function App() {
  const [route, setRoute] = useState(parseRoute);
  const [authed, setAuthed] = useState(() => Boolean(getToken()));

  useEffect(() => {
    const onPop = () => setRoute(parseRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function goTrack(token) {
    window.history.pushState({}, "", appPath(`/track/${token}`));
    setRoute({ name: "track", token });
  }

  function goHome() {
    window.history.pushState({}, "", appPath("/"));
    setRoute({ name: "app" });
  }

  if (route.name === "track") {
    return <Track token={route.token} onBack={goHome} />;
  }

  if (!authed) {
    return <Login onLoggedIn={() => setAuthed(true)} />;
  }

  return (
    <Home
      onLogout={() => setAuthed(false)}
      onOpenTrack={goTrack}
    />
  );
}
