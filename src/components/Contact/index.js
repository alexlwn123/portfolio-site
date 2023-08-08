import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import CalendlyIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";

export default function Contact() {
  return (
    <div
      className="flex text-center flex-col gap-12 mt-10 overflow-hidden py-10" 
    >
      <div className="text-4xl font-bold">
        Contact
      </div>
      <div className="flex-auto w-80 flex justify-center text-center items-center gap-5 m-auto">
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
