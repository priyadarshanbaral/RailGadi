import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Trains from "./pages/Trains.jsx";
import Stations from "./pages/Stations.jsx";
import LiveTracking from "./pages/LiveTracking.jsx";
import About from "./pages/About.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TrainPage from "./pages/TrainPage.jsx";
import RouteMap from "./pages/RouteMap.jsx";
import DataPage from "./pages/DataPage.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/trains" element={<Trains />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/live" element={<LiveTracking />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/train/:number" element={<TrainPage />} />
          <Route path="/map/:number" element={<RouteMap />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
