import { YouTube, Link, GitHub, Twitter } from '@mui/icons-material';
export default function work({ title, desc, link, code, img, video, tweet, under, place, event }) {
  const Medal = (place) => {
    return place === 1 ? '🥇' : '🥈';
  }
  return (
    <div className="bg-[#0b212d] w-full h-full rounded-2xl p-4 flex flex-col justify-between border-yellow-500 border-[1px] ">
      <div>
        <div className="relative w-full rounded-2xl">
          <img
            src={img}
            alt={title}
            className="w-full h-full max-h-[200px] min-h-[200px] rounded-[10px] object-contain border-[1px] border-secondary"
          />
        </div>
        <div className="mt-5">
          <h3 className="text-white font-bold text-[24px]">{title}</h3>
          <p className="mt-2 text-secondary text-[14px]">{desc}</p>
          {under && <p className="mt-2 text-secondary text-[14px] font-bold text-yellow-500">{under}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[14px]">
        {place && 
          <div
            onClick={() => window.open(event, "_blank")}
            className="w-9 h-9 border-secondary flex items-center justify-center cursor-pointer hover:scale-110 hover:transition transition"
          >
            <p className='text-4xl'>{Medal(place)}</p>
          </div>
        }
        <div
          onClick={() => window.open(code, "_blank")}
          className="bg-slate-800 w-9 h-9 rounded-full border-[1px] border-secondary flex items-center justify-center cursor-pointer hover:scale-110 hover:transition transition"
        >
          <GitHub className="w-4/5 h-4/5 object-contain" />
        </div>
        <div
          onClick={() => window.open(link, "_blank")}
          className="bg-slate-800 w-9 h-9 rounded-full border-[1px] border-secondary flex items-center justify-center cursor-pointer hover:scale-110 hover:transition transition"
        >
          <Link className="w-4/5 h-4/5 object-contain" />
        </div>
        {video && 
          <div
            onClick={() => window.open(video, "_blank")}
            className="bg-slate-800 w-9 h-9 rounded-full border-[1px] border-secondary flex items-center justify-center cursor-pointer hover:scale-110 hover:transition transition"
          >
            <YouTube className="w-4/5 h-4/5 object-contain" />
          </div>
        }
        {tweet && 
          <div
            onClick={() => window.open(tweet, "_blank")}
            className="bg-slate-800 w-9 h-9 rounded-full border-[1px] border-secondary flex items-center justify-center cursor-pointer hover:scale-110 hover:transition transition"
          >
            <Twitter className="w-4/5 h-4/5 object-contain" />
          </div>
        }
      </div>
    </div>
  );
}
