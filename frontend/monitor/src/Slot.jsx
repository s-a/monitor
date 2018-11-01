import React, { Component } from 'react';
import './App.css';
import SlotInfo from './SlotInfo';
import Meter from './Meter';



function capitalize(s) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b./g, function (a) { return a.toUpperCase(); });
};

class Slot extends Component {

  renderSlotDetails(slot) {
    const result = []
    let lastKey = ''
    const ignoreList = ['hostname', 'name', 'computername', 'sender', 'valid_state', 'icon', 'status', 'text']
    for (const key in slot.details) {
      const uniqueKey = slot.details.hostname + '-' + slot.details.computername + '-' + slot.details.name + '-' + key
      if (ignoreList.indexOf(key) === -1 && slot.details.hasOwnProperty(key)) {
        const data = slot.details[key] || 'null'

        let keyControl = capitalize(key)
        let valueControl = JSON.stringify(data, '/t', 2)
        if (typeof data === 'object') {
          keyControl = (
            <a href={"#" + uniqueKey} className="" data-toggle={"collapse"}>{capitalize(key)}</a>
          )
          valueControl = (
            <pre><code id={uniqueKey} className={"collapse"}>{data ? JSON.stringify(data, '/t', 2) : null}</code></pre>
          )
        }
        let slotItemDetail = (
          <SlotInfo key={uniqueKey + '-slotinfo'} id={uniqueKey + '-slotinfo'} keyControl={keyControl} valueControl={valueControl} />
        )
        if (key > lastKey) {
          result.unshift(slotItemDetail)
        } else {
          result.push(slotItemDetail)
        }

        lastKey = key
      }
    }
    return result
  }

  render() {
    return (
      <div className="slot">
        <div className="col">
          <a href={"#" + this.props.id} className={"text-" + (this.props.slot.details.valid_state || 'success')} data-toggle={"collapse"}>
            <i className={this.props.slot.details.icon || "fas fa-rocket"}></i> {this.props.slot.details.name} <small>{this.props.slot.version}</small>
          </a>
          <div id={this.props.id} className="collapse">
            <div className="container-fliud">
              {this.renderSlotDetails(this.props.slot)}
            </div>
          </div>
          <div className="">
            <small>
              {this.props.slot.details.text}
            </small>
          </div>
        </div>
      </div>
    );
  }
}

export default Slot;


