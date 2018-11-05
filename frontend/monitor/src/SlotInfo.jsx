import React, { Component } from 'react';
import './App.css';

class SlotInfo extends Component {

  render() {
    return (
      <div className="row ">
        <div className="col">
          {this.props.keyControl}:
        </div>
        <div className="col">
          {this.props.valueControl}
        </div>
      </div>
    )
  }
}

export default SlotInfo;


