import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import CalendlyIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import { useEffect, useState } from "react";
import { useScrollPosition } from "../hooks/useScrollPosition";

export default function Slidebar() {
  const scrollPosition = useScrollPosition();
  const [focusedComponent, setFocusedComponent] = useState(null);
  const [scrollHeights, setScrollHeights] = useState([0, 0, 0, 0, 0]);
  useEffect(() => {
    const projects = document.querySelector("#projects").scrollHeight;
    const timeline = document.querySelector("#timeline").scrollHeight;
    const contact = document.querySelector("#contact").scrollHeight;
    setScrollHeights([
      0,
      projects,
      timeline + projects,
      contact + timeline + projects,
    ]);
  }, [focusedComponent]);

  useEffect(() => {
    const section =
      scrollPosition === 0
        ? 0
        : scrollPosition <= scrollHeights[1]
        ? 1
        : scrollPosition <= scrollHeights[2]
        ? 2
        : 3;
    if (focusedComponent === section) return;
    setFocusedComponent(section);
  }, [focusedComponent, scrollHeights, scrollPosition]);

  const copy = () => {
    navigator?.clipboard?.writeText("Alex Lewin");
  };
  return (
    <div className="collapse sm:visible bg-black h-screen min-w-[25%] fixed">
      <div className="nav flex text-white text-lg mt-10 flex-col align-middle justify-center text-center w-full gap-5 overflow-hidden">
        <div>
          <img
            src={"/src/assets/images/alex-lewin.png"}
            alt="Alex Lewin, Full Stack Developer"
            aria-label="Alex Lewin, Full Stack Developer"
            className="border-solid cursor-pointer border-[2px] border-stone-600 min-h-fit mx-auto max-w-[250px]"
            loading="lazy"
          />
          <h1
            className="text-white pt-4 text-3xl hover:scale-105 cursor-pointer"
            tabIndex={0}
          >
            Alex Lewin
          </h1>
        </div>
        <nav aria-label="Main navigation" className="mt-6">
          <ul className="flex flex-col gap-2">
            <li>
              <a
                href="/#"
                aria-label="Home section"
                className={`cursor-pointer hover:text-blue-600 hover:text-xl transition hover:transition ${
                  focusedComponent === 0 ? "text-blue-600" : ""
                }`}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/#projects"
                aria-label="Projects section"
                className={`cursor-pointer hover:text-blue-600 hover:text-xl transition hover:transition ${
                  focusedComponent === 1 ? "text-blue-600" : ""
                }`}
              >
                Projects
              </a>
            </li>
            <li>
              <a
                href="/#timeline"
                aria-label="Timeline section"
                className={`cursor-pointer hover:text-blue-600 hover:text-xl transition hover:transition ${
                  focusedComponent === 2 ? "text-blue-600" : ""
                }`}
              >
                Timeline
              </a>
            </li>
            <li>
              <a
                href="/#contact"
                aria-label="Contact section"
                className={`cursor-pointer hover:text-blue-600 hover:text-xl transition hover:transition ${
                  focusedComponent === 3 ? "text-blue-600" : ""
                }`}
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="text-white flex flex-row gap-3 w-fit mx-auto pt-7">
        <a
          href="https://github.com/alexlwn123"
          aria-label="GitHub profile of Alex Lewin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubIcon className="cursor-pointer hover:scale-105" />
        </a>
        <a
          href="https://www.linkedin.com/in/alex-lewin-058265174/"
          aria-label="LinkedIn profile of Alex Lewin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkedInIcon className="cursor-pointer hover:scale-105" />
        </a>
        <a
          href="https://twitter.com/_AlexLewin"
          aria-label="Twitter profile of Alex Lewin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <TwitterIcon className="cursor-pointer hover:scale-105" />
        </a>
        <a
          href="https://calendly.com/alexlewin/30-minutes"
          aria-label="Book a meeting with Alex Lewin on Calendly"
          target="_blank"
          rel="noopener noreferrer"
        >
          <CalendlyIcon className="cursor-pointer hover:scale-105" />
        </a>
        <a
          href="mailto:alexlwn123@gmail.com"
          aria-label="Email Alex Lewin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <EmailIcon className="cursor-pointer hover:scale-105" />
        </a>
      </div>
    </div>
  );
}
