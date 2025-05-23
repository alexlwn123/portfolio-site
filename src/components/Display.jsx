import "../App.css";
import Home from "./Home";
import Timeline from "./Timeline";
import Projects from "./Projects";
import Contact from "./Contact";

export default function Display() {
  return (
    <div className="sm:pl-[25%] sm:w-4/5 px-7 m-auto back text-white p-3 bg-fixed divide-y-4 divide-slate-100">
      <Home />
      <Projects />
      <Timeline />
      <Contact />
    </div>
  );
}
