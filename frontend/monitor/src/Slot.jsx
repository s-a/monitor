import React, { Component } from 'react';
import './App.css';
import SlotInfo from './SlotInfo';
import Meter from './Meter';
import Expandable from './Expandable';



function capitalize(s) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b./g, function (a) { return a.toUpperCase(); });
};

class Slot extends Component {

  renderSlotDetails(slot) {
    const result = []
    let lastKey = ''
    const ignoreList = ['CRON_EXPRESSION_TEXT', 'hostname', 'name', 'computername', 'sender', 'valid_state', 'icon', 'status', 'text']
    for (const key in slot.details) {
      const uniqueKey = slot.details.hostname + '-' + slot.details.computername + '-' + slot.details.name + '-' + key
      if (ignoreList.indexOf(key) === -1 && slot.details.hasOwnProperty(key)) {
        const data = slot.details[key] || 'null'

        let keyControl = <span className="slot-info-detail">{capitalize(key)}</span>
        let valueControl = <span className="slot-info-detail">{data}</span>
        if (typeof data === 'object') {
          keyControl = (
            <a className="slot-info-detail" href={"#" + uniqueKey} className="" data-toggle={"collapse"}>{capitalize(key)}</a>
          )
          valueControl = (
            <pre className="slot-info-detail"><code id={uniqueKey} className={"collapse"}>{data ? JSON.stringify(data, '/t', 2) : null}</code></pre>
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

    result.unshift('', <small className="slot-sender" key={lastKey + '-'}>{'remote v' + slot.version} reports {slot.details.CRON_EXPRESSION_TEXT}:</small>)
    return result
  }

  render() {
    return (
      <div className="col-4">
        <Expandable className="slot"
          header={(
            <div className={'text-' + this.props.slot.details.valid_state}>
              <i className={this.props.slot.details.icon || "fas fa-rocket"}></i> {this.props.slot.details.name}
            </div>
          )}
          footer={(
            <small>
              {this.props.slot.details.text}
            </small>
          )}>
          <div className="container-fluid">
            {this.renderSlotDetails(this.props.slot)}
          </div>
        </Expandable>

      </div >
    );
  }
}

export default Slot;


