import { useEffect } from "react";
import LiveCursors from "./components/LiveCursors";
import { SpaceContextProvider } from "./components/SpacesContext";

const App = () => {
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    console.log(userId);

    if (!userId) {
      getUserID();
    }
  }, []);

  const getUserID = async () => {
    try {
      const response = await fetch(
        "https://atlas-map-express-api.up.railway.app//newUser"
      );
      const data = await response.json();

      console.log(data);

      localStorage.setItem("userId", data.insertedId);
    } catch (error) {
      console.error("Error fetching user ID:", error);
    }
  };

  return (
    <SpaceContextProvider example="member-location">
      <LiveCursors />
    </SpaceContextProvider>
  );
};
export default App;
