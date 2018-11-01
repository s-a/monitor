import React, { Component } from 'react';
import './App.css';

class Meter extends Component {

  render() {
    return (
      <div className="meter">
        <div className="step step-1"></div>
        <div className="step step-1"></div>
        <div className="step step-1"></div>
        <div className="step step-1"></div>
        <div className="step step-1"></div>
        <div className="step step-2"></div>
        <div className="step step-2"></div>
        <div className="step step-2"></div>
        <div className="step step-3"></div>
        <div className="step step-3"></div>
      </div>
    )
  }
}

export default Meter;


