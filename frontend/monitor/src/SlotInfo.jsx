import React, { Component } from 'react';
import './App.css';

class SlotInfo extends Component {

  render() {
    return (
      <div className="row">
        <div className="col-12">
          <div className="line-1 anim-typewriter">
            {this.props.keyControl}: {this.props.valueControl}
          </div>
        </div>
      </div>
    )
  }
}

export default SlotInfo;


