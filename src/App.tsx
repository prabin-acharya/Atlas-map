import LiveCursors from "./components/LiveCursors";
import { SpaceContextProvider } from "./components/SpacesContext";

const App = () => (
  <SpaceContextProvider example="member-location">
    <LiveCursors />
  </SpaceContextProvider>
);

export default App;
