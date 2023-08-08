import React from 'react';
import 'react-vertical-timeline-component/style.min.css';
import { School } from '@mui/icons-material'
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';



export default function Resume() {
  return (
    <div id="resume" className="min-h-screen flex-col items-center text-center m-auto py-5">
      <div className="text-5xl font-bold py-8">
        Timeline
      </div>
      <VerticalTimeline 
        layout='2-columns'
        animate={true} 
        lineColor='rgb(59, 130, 246)'
      >
        <VerticalTimelineElement
          contentStyle={{ background: '#0b212d', color: '#fff' }}
          contentArrowStyle={{ borderRight: '7px solid green' }}
          date="May 2022"
          iconStyle={{ background: '#0b212d', color: '#fff' }}
          icon={<School />}
        >
          <h3 className="font-large">BlockSpaces</h3>
          <h4 className="vertical-timeline-element-subtitle text-yellow-500">Full Stack Engineer</h4>
          <p>Bitcoin Lightning</p>
        </VerticalTimelineElement>
        <VerticalTimelineElement
          contentStyle={{ background: '#0b212d', color: '#fff' }}
          contentArrowStyle={{ borderRight: '7px solid green' }}
          date="May 2020"
          iconStyle={{ background: '#0b212d', color: '#fff' }}
          icon={<School />}
        >
          <h3 className="vertical-timeline-element-title">NCR Corporation</h3>
          <h4 className="vertical-timeline-element-subtitle text-yellow-500">Software Engineer</h4>
          <p>Software Innovation Lab</p>
        </VerticalTimelineElement>
        <VerticalTimelineElement
          contentStyle={{ background: '#0b212d', color: '#fff' }}
          contentArrowStyle={{ borderRight: '7px solid green' }}
          date="August 2018"
          iconStyle={{ background: '#0b212d', color: '#fff' }}
          icon={<School />}
        >
          <h3 className="vertical-timeline-element-title">Began Univeristy</h3>
          <h4 className="vertical-timeline-element-subtitle text-yellow-500">Auburn University</h4>
          <p>Undergraduate Software Engineering</p>
        </VerticalTimelineElement>
      </VerticalTimeline>
    </div>
  );
}
