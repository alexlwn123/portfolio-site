import "../App.css";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import CalendlyIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import React, { useEffect } from "react";
import { useScrollPosition } from "../hooks/useScrollPosition";

export default function Slidebar() {
  const scrollPosition = useScrollPosition();
  const [focusedComponent, setFocusedComponent] = React.useState(null);
  const [scrollHeights, setScrollHeights] = React.useState([0, 0, 0, 0, 0]);
  useEffect(() => {
    const projects = document.querySelector("#projects").scrollHeight;
    const timeline = document.querySelector("#timeline").scrollHeight;
    const contact = document.querySelector("#contact").scrollHeight;
    setScrollHeights([0, projects, timeline+projects, contact+timeline+projects]);
  }, [focusedComponent]);

  useEffect(() => {
    const section = scrollPosition === 0 ? 0 
      : scrollPosition <= scrollHeights[1] ? 1
      : scrollPosition <= scrollHeights[2] ? 2
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
            src={require("../assets/images/Portraitpic.png")}
            alt="Alex Lewin"
            className="border-solid cursor-pointer border-[2px] border-stone-600 min-h-fit mx-auto  max-w-[250px]"
          />
          <h2 onClick={copy} className="text-white pt-4 text-3xl hover:scale-105 cursor-pointer">
            Alex Lewin
          </h2>
        </div>
        <p
          className={`cursor-pointer hover:text-blue-600 hover:text-xl transition hover:transition
            ${focusedComponent === 0 ? "text-blue-600" : ""}
          `}
        >
          <a href="/#">Home</a>
        </p>
        <p
          className={`cursor-pointer hover:text-blue-600 hover:text-xl transition hover:transition
            ${focusedComponent === 1 ? "text-blue-600" : ""}
          `}
        >
          <a href="/#projects">Projects</a>
        </p>
        <p
          className={`cursor-pointer hover:text-blue-600 hover:text-xl transition hover:transition
            ${focusedComponent === 2 ? "text-blue-600" : ""}
          `}
        >
          <a href="/#timeline">Timeline</a>
        </p>
        <p
          className={`cursor-pointer hover:text-blue-600 hover:text-xl transition hover:transition
            ${focusedComponent === 3 ? "text-blue-600" : ""}
          `}
        >
          <a href="/#contact">Contact</a>
        </p>
      </div>
      <div className="text-white flex flex-row gap-3 w-fit mx-auto pt-7" >
        <div
          onClick={() =>
            window.open("https://github.com/alexlwn123", "_blank")
          }
        >
          <GitHubIcon className="cursor-pointer hover:scale-105" />
        </div>
        <div
          onClick={() =>
            window.open(
              "https://www.linkedin.com/in/alex-lewin-058265174/",
              "_blank"
            )
          }
        >
          {" "}
          <LinkedInIcon className="cursor-pointer hover:scale-105" />
        </div>
        <div
          onClick={() =>
            window.open("https://twitter.com/_AlexLewin", "_blank")
          }
        >
          <TwitterIcon className="cursor-pointer hover:scale-105" />
        </div>
        <div
          onClick={() =>
            window.open("https://calendly.com/alexlewin/30-minutes", "_blank")
          }
        >
          <CalendlyIcon className="cursor-pointer hover:scale-105" />
        </div>
        <div
          onClick={() =>
            window.open("mailto:alexlwn123@gmail.com", "_blank")
          }
        >
          <EmailIcon className="cursor-pointer hover:scale-105" />
        </div>
      </div>
    </div>
  );
}
