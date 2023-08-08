import "../../App.css";

export default function Home() {
  return (
    <div className="min-h-screen grid grid-cols-1 gap-7 name content-center text-center px-2">
      <h1
        className="head text-5xl font-semibold tracking-[3px] pb-2 pt-20 "
      >
       <span className="wave">✋</span> Hiya, I'm Alex.
      </h1>
      <div
        className="text-4xl text-yellow-500 pb-10"
      >
        {" "}
        <h1>A software engineer from Atlanta, GA.</h1>
      </div>
      <div className="w-full m-auto pb-10">
        <ul className="text-center list-none list-inside text-sm lg:text-xl space-y-2">
          <li className="hover:animate-pulse">I like to study 📚 & build 🔨 projects with <span className="text-yellow-500">₿itcoin</span>.</li>
          <li className="hover:animate-pulse">I like to discover 🔎 & tinker️ with new tech 🤖.</li>
          <li className="hover:animate-pulse">I like to travel 🌎 and compete 🥇 in hackathons.</li>
        </ul>
      </div>
      <button
        className="py-2 mx-auto px-7 bg-transparent border-2 w-fit border-blue-500 rounded-sm  hover:-translate-y-1.5 duration-[350ms] hover:duration-[350ms] hover:bg-blue-800"
      >
        <a href="#contact">Reach Out</a>
      </button>
      <div
        className="m-auto cursor-pointer w-fit bottom-16 pt-10 hover:-translate-y-1.5 duration-[350ms] hover:duration-[350ms]"
      >
        <a href="#projects" className="text-slate-400">
          <svg
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
            fillRule="evenodd"
            clipRule="evenodd"
            fill="currentColor"
          >
            <path d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12-12-5.377-12-12 5.377-12 12-12zm0 1c6.071 0 11 4.929 11 11s-4.929 11-11 11-11-4.929-11-11 4.929-11 11-11zm5.247 8l-5.247 6.44-5.263-6.44-.737.678 6 7.322 6-7.335-.753-.665z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
