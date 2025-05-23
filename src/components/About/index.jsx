import "../../App.css";

export default function About() {
  return (
    <div
      id="about"
      className="min-h-screen bg-white flex flex-col text-center gap-5 text-black text-lg font-normal"
    >
      <div className="head text-5xl mt-12 font-bold">About Me</div>
      <div className="flex flex-row  gap-6 ml-8">
        <div className="flex-col mt-14 flex flex-auto w-64 gap-6">
          <h3 className="text-3xl font-medium">
            I'm <span className="text-yellow-600">Alex Lewin</span>, a Software
            Engineer focused on Bitcoin and the Lightning Network.
          </h3>
          <p className=" pt-5 text-slate-900 text-justify-center">
            I'm passionate about bringing new ideas to life with software.
          </p>
          <p className="text-justify leading-7 text-slate-900"></p>
        </div>
      </div>
    </div>
  );
}
