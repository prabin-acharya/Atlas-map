import { useEffect, useState } from "react";
import LiveCursors from "./components/LiveCursors";
import { SpaceContextProvider } from "./components/SpacesContext";

const App = () => {
  const [userId, setUserId] = useState<undefined | string>();

  useEffect(() => {
    const userIdFromLS = localStorage.getItem("userId");
    userIdFromLS && setUserId(userIdFromLS);

    if (!userIdFromLS) {
      getUserID();
    }
  }, []);

  const getUserID = async () => {
    try {
      const response = await fetch(
        "https://atlas-map-express-api.up.railway.app/newUser"
      );
      const data = await response.json();

      setUserId(data.insertedId);
      localStorage.setItem("userId", data.insertedId);
    } catch (error) {
      console.error("Error fetching user ID:", error);
    }
  };

  return (
    <>
      {userId && (
        <SpaceContextProvider userId={userId}>
          <LiveCursors />
        </SpaceContextProvider>
      )}
    </>
  );
};
export default App;
