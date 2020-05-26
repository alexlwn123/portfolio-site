import React from 'react';

function Navbar(props) {
  return (
    <div>
      <button onClick={() => props.handler("home")}>Home</button>
      <button onClick={() => props.handler("sorting")}>Sorting Visualizer</button>
      <p></p>
      <p></p>
    </div>
  )

}


export default Navbar;
