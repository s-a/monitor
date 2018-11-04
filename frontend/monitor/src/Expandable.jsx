import React, { Component } from 'react';
import './App.css';

let count = 0;

class Expandable extends Component {
  constructor(props) {
    super(props)
    this.state = {
      show: (this.props.show !== undefined ? this.props.show : false)
    }
    this.guid = 'input-ui-' + count++;
  }

  render() {

    return (
      <div className={this.props.className}>
        <a data-toggle="collapse" href={'#' + this.guid} role="button" aria-expanded={this.state.show.toString()} aria-controls={this.guid}>
          {this.props.header}
        </a>
        <div className={"collapse" + (this.state.show ? ' show' : '') + ''} id={this.guid}>
          {this.props.children}
        </div>
        {this.props.footer}
      </div>
    )
  }
}

export default Expandable;


