import "../App.css";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import CalendlyLink from "@mui/icons-material/CalendarToday";
import React from "react";

export default function Slidebar(props) {
  return (
    <div className="collapse sm:visible bg-black h-screen min-w-[25%] fixed">
      <div className="nav flex text-white text-lg mt-10 flex-col align-middle justify-center text-center w-full gap-5 overflow-hidden">
        <div>
          <img
            src={require("../assets/images/MyImage.webp")}
            alt="Alex Lewin"
            className="rounded-full border-solid cursor-pointer border-[8px] border-stone-600 min-h-fit mx-auto  max-w-[190px]"
          />
          <h3 className="text-white name py-4 font-medium ">
            Alex Lewin
          </h3>
        </div>
        <p
          className={`cursor-pointer hover:text-blue-600 hover:-translate-y-0.5 hover:text-xl transition hover:transition`}
        >
          <a href="/#">Home</a>
        </p>
        <p
          className={`cursor-pointer hover:text-blue-600 hover:-translate-y-0.5 hover:text-xl transition hover:transition`}
        >
          <a href="/#resume">Resume</a>
        </p>
        <p
          className={`cursor-pointer hover:text-blue-600 hover:-translate-y-0.5 hover:text-xl transition hover:transition`}
        >
          <a href="/#projects">Projects</a>
        </p>
        <p
          className={`cursor-pointer hover:text-blue-600 hover:-translate-y-0.5 hover:text-xl transition hover:transition`}
        >
          <a href="/#contact">Contact</a>
        </p>
      </div>
      <div className="text-white flex flex-row gap-5 w-fit mx-auto pt-7" >
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
          <CalendlyLink className="cursor-pointer hover:scale-105" />
        </div>
      </div>
    </div>
  );
}
