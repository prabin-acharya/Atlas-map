import { Realtime } from "ably";
import { AblyProvider } from "ably/react";
import { nanoid } from "nanoid";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/container.css";
import "./styles/tailwind.css";

const client = new Realtime.Promise({
  clientId: nanoid(),
  key: "qhsChQ.3GgEbQ:_1oajH3U0m3mo8cgILQm2JZaCsYHjpHkYcvQhJAg8do",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  // Mismatch between react-router-dom and latest react
  // See https://github.com/remix-run/remix/issues/7514
  // @ts-ignore
  <AblyProvider client={client}>
    <App />
  </AblyProvider>,
);
