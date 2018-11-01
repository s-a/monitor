import React, { Component } from 'react';
import './App.css';




class Device extends Component {


  render() {
    /* beautify preserve:start */
    return (
      <div className="rack inner-shadow">
        {/* <div className="handle left inner-shadow">
            
          </div> */}
        <div className="col" >
          <div className="display ">
            {this.props.children}
          </div>
        </div>

        {/* <div className="handle right ">
          <div className="led-red"></div>
          <div className="led-yellow"></div>
          <div className="led-green"></div>
          <div className="led-blue"></div>
        </div> */}
      </div>
    );
    /* beautify preserve:end */
  }
}

export default Device;


