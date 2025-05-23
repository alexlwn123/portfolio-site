import React, { useState } from "react";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import CalendlyIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";

export default function Contact() {
  const handleCopyEmail = () => {
    navigator.clipboard.writeText("alexlwn123@gmail.com");
  };

  const [showCopied, setShowCopied] = useState(false);

  const handleCopyWithTooltip = () => {
    handleCopyEmail();
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1000);
  };
  return (
    <div
      id="contact"
      className="flex text-center flex-col gap-12 mt-10 overflow-hidden py-10"
    >
      <div className="text-4xl font-bold">Contact</div>
      <div className="flex-auto w-80 flex justify-center text-center items-center gap-5 m-auto">
        <div
          onClick={() => window.open("https://github.com/alexlwn123", "_blank")}
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
        <div className="relative">
          <button
            onClick={handleCopyWithTooltip}
            aria-label="Copy email address to clipboard"
            className="cursor-pointer hover:scale-105"
          >
            <EmailIcon />
          </button>
          {showCopied && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm">
              Copied
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
