import React, { Component } from 'react';
import './App.css';

class SlotInfo extends Component {

  render() {
    return (
      <div className="row">
        <div className="col-12">
          {this.props.keyControl}: {this.props.valueControl}
        </div>
      </div>
    )
  }
}

export default SlotInfo;


