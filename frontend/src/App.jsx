import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import Mp3Library from "./pages/Mp3Library";
import CreatePlaylist from "./pages/CreatePlaylist";
import MyPlaylists from "./pages/MyPlaylists";
import PlaylistDetail from "./pages/PlaylistDetail";
import { PlayerProvider } from "./context/PlayerContext";
import MiniPlayer from "./components/player/MiniPlayer";

export default function App() {
  const [activePage, setActivePage] = useState("library");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  const navigate = (page, id = null) => {
    setActivePage(page);
    if (id) setSelectedPlaylistId(id);
  };

  const renderPage = () => {
    switch (activePage) {
      case "library":       return <Mp3Library />;
      case "create":        return <CreatePlaylist navigate={navigate} />;
      case "my-playlists":  return <MyPlaylists navigate={navigate} />;
      case "playlist":      return <PlaylistDetail id={selectedPlaylistId} navigate={navigate} />;
      default:              return <Mp3Library />;
    }
  };

  return (
    <PlayerProvider>
      <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
        <Sidebar activePage={activePage} navigate={navigate} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopBar activePage={activePage} />
          <main style={{ flex: 1, overflowY: "auto", padding: "0" }}>
            {renderPage()}
          </main>
          <MiniPlayer />
        </div>
      </div>
    </PlayerProvider>
  );
}
