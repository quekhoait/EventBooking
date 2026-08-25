import "./App.css";
import { Route, Routes } from "react-router-dom";
import Nav from "./layouts/nav";
import routes from "./routes";

function App() {
  return (
    <div className="booking-shell min-h-screen">
      <Nav />
      <Routes>
        {routes.map((route, index) => {
          const Page = route.page;
          return (
            <Route
              key={route.path || index}
              path={route.path}
              element={<Page />}
            />
          );
        })}
      </Routes>
    </div>
  );
}

export default App;
