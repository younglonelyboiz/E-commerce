import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
function App() {
  return (
    <div className="min-vh-100 d-flex flex-column">

      <Header />


      <Outlet />
      <Footer />


    </div>
  );
}

export default App;