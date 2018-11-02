import React, { Component } from 'react';
import './App.css';

class DownSlider extends Component {
  constructor(props) {
    super(props)
    this.state = {
      expanded: (this.props.expanded !== undefined ? this.props.expanded : false)
    }
  }


  onClick() {
    this.setState({ expanded: !this.state.expanded })
  }
  render() {
    return (
      <div className="expandable">
        <div className="action" onClick={this.onClick.bind(this)}>
          {this.props.clickableContent}
        </div>
        <div className={"body " + (this.state.expanded ? 'slidedown' : 'slideup')} ref={(e) => { this.container = e }}>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default DownSlider;


