import Work from "./work";
import { projects } from "../../constants";
export default function Projects() {
  return (
    <div
      id="projects"
      className="min-h-screen flex flex-col justify-center text-center gap-10 py-20"
    >
      <div
        className="font-extrabold text-5xl"
      >
        Projects
      </div>
      <p>Here's a collection of personal projects I'm most proud of.</p>
      {/* <div className="grid-cols-1 sm:grid-cols-2 flex flex-wrap flex-row justify-center w-full p-4 gap-12"> */}
      <div className="grid grid-cols-1 md:grid-cols-2 justify-center w-full gap-8">
        {projects.map((project, ind) => {
          return (
            <div key={ind}>
              <Work
                title={project.title}
                desc={project.desc}
                under={project.under}
                img={project.img}
                link={project.link}
                code={project.code}
                video={project.video}
                tweet={project.tweet}
                place={project.place}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
