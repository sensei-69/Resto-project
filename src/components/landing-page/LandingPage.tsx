import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Values } from "./Values";
import { DishShow } from "./DishShow";
import { Location } from "./Location";
import { Contact } from "./Contact";
import { Footer } from "./Footer";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleMenuClick = () => {
    navigate("/menu");
  };

  return (
    <div className="lp-root">
      <Navbar />
      <main>
        <Hero onMenuClick={handleMenuClick} />
        <DishShow />
        <Values />
        <Location />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
