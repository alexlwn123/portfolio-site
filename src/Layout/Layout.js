import React from "react";
import "../App.css";
class Layout extends React.Component {
  render() {
    return (
      <React.Fragment>
        <div class="page">
          <div className="flex flex-row overflow-hidden">
            {this.props.children}
          </div>
          <div class="cursor"></div>
        </div>
      </React.Fragment>
    );
  }
}
export default Layout;
