import "./App.css";
import { Route, Routes } from "react-router-dom";
import Header from "./layouts/header";
import routes from "./routes";

function App() {
  return (
    <div className="booking-shell min-h-screen">
      <Header />
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
