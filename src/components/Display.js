import "../App.css";
import Home from "./Home";
import Resume from "./Resume";
import Projects from "./Projects";
import Contact from "./Contact";

export default function Display() {
  return (
    <div className="sm:pl-[25%] w-screen back text-white p-3 bg-fixed">
      <Home />
      <Resume />
      <Projects />
      <Contact />
    </div>
  );
}
