import React, { useState } from 'react';
import SortingSketch from './components/sorting';
import './App.css';
import Navbar from './components/Navbar';

function App() {
  const [currentScreen, setScreen] = useState("home")
  let currComponent = currentScreen === "sorting" ? <SortingSketch handler={setScreen} />  : currentScreen === "home" ? <p>HOMESCREEN</p> : undefined;
  
  return (
    <div>
      <Navbar handler={setScreen} />
      <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
        {currComponent}
      </div>
    </div>
  );
}

export default App;
