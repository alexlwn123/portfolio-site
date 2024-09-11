import React, { useEffect } from 'react';
import 'react-vertical-timeline-component/style.min.css';
import { AppShortcut, PermIdentity, School, Bolt, AttachMoney } from '@mui/icons-material'
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';

export default function Timeline() {
  useEffect(() => {
    const elems = document.querySelectorAll('.vertical-timeline-element-date');
    elems.forEach((elem) => {
      elem.style.textAlign = 'center';
    });
  }, []);

  const timelineElementStyle = {
    background: '#0b212d',
    color: '#fff',
    transition: 'all 0.3s ease',
  };

  return (
    <div id="timeline" className="text-center m-auto py-20 mt-20">
      <div className="text-5xl font-bold py-8">
        Timeline
      </div>
      <VerticalTimeline
        layout='2-columns'
        animate={true}
        lineColor='rgb(59, 130, 246)'
      >
        {[
          {
            date: "March 2024",
            icon: <AppShortcut />,
            title: "Fedi",
            subtitle: "Senior Software Engineer",
            content: "Building a community focused super app and developer tooling for fedimint"
          },
          {
            date: "November 2023",
            icon: <PermIdentity />,
            title: "Zion",
            subtitle: "Full Stack Engineer",
            content: "Building applications involving Decentralized Identity"
          },
          {
            date: "May 2022",
            icon: <Bolt />,
            title: "BlockSpaces",
            subtitle: "Full Stack Engineer",
            content: "My first exposure to the start-up world"
          },
          {
            date: "May 2020",
            icon: <AttachMoney />,
            title: "NCR Corporation",
            subtitle: "Software Engineer",
            content: "Software Innovation Lab"
          },
          {
            date: "August 2018",
            icon: <School />,
            title: "Began University",
            subtitle: "Auburn University",
            content: "Undergraduate Software Engineering"
          }
        ].map((item, index) => (
          <VerticalTimelineElement
            key={index}
            contentStyle={{
              ...timelineElementStyle,
              cursor: 'pointer',
            }}
            contentArrowStyle={{ borderRight: '7px solid green' }}
            date={item.date}
            iconStyle={{ background: '#0b212d', color: '#fff' }}
            icon={item.icon}
          >
            <div>
              <h3 className="font-large">{item.title}</h3>
              <h4 className="text-yellow-500">{item.subtitle}</h4>
              <p>{item.content}</p>
            </div>
          </VerticalTimelineElement>
        ))}
      </VerticalTimeline>
    </div>
  );
}
