import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
function upd(a, b) {
  for (var i in b) {
    if (b.hasOwnProperty(i)) {
      a[i] = b[i]
    }
  }
};

function capitalize(s) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b./g, function (a) { return a.toUpperCase(); });
};


class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      log: {
        details: {}
      },
      slots: []
    }
  }



  upsertSlot(slotData) {
    let found = false
    const slots = this.state.slots
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      if (slot && slot.details.hostname === slotData.details.hostname && slot.details.computername === slotData.details.computername && slot.details.name === slotData.details.name) {
        upd(slot.details, slotData.details)
        slots[i] = slot
        found = true
        break
      }
    }
    if (!found) {
      slots.push(slotData)
    }
    this.setState({ slots })
  }

  componentDidMount() {
    const self = this
    var W3CWebSocket = window.WebSocket;
    var client = new W3CWebSocket(`ws://${window.location.hostname}:5040`, 'echo-protocol');

    client.onerror = function () {
      console.log('Connection Error');
    };

    client.onopen = function () {
      console.log('Master Server Connected');
    };

    client.onclose = function () {
      console.log('echo-protocol Client Closed');
    };

    client.onmessage = function (e) {
      if (typeof e.data === 'string') {
        const log = JSON.parse(e.data)
        console.log(log);
        if (log.hostname) {
          const slots = self.state.slots
          log.details.hostname = log.hostname
          // log.details.computername = log.details.computername
          self.upsertSlot(log)
          // {this.state.log.hostname} {this.state.log.details.computername} {this.state.log.details.name}
          self.setState({ slots })
        }
      }
    };
  }

  /* 
  <button class="collapsible">Open Collapsible</button>
<div class="content">
  <p>Lorem ipsum...</p>
</div>
 */
  renderSlotDetails(slot) {
    const result = []
    let lastKey = ''
    const ignoreList = ['hostname', 'name', 'computername', 'sender']
    for (const key in slot.details) {
      const uniqueKey = slot.details.hostname + '-' + slot.details.computername + '-' + slot.details.name + '-' + key
      if (ignoreList.indexOf(key) === -1 && slot.details.hasOwnProperty(key)) {
        const data = slot.details[key] || 'null'
        let keyControl = <strong>{capitalize(key)}: </strong>
        let valueControl = JSON.stringify(data, '/t', 2)
        if (typeof data === 'object') {
          keyControl = null
          valueControl = (
            <pre>
              <button href={"#" + uniqueKey} className="btn btn-error" data-toggle={"collapse"}>{capitalize(key)}</button>
              <code id={uniqueKey} className={"collapse"}>{data ? JSON.stringify(data, '/t', 2) : null}</code>
            </pre>
          )
        }
        let slotItemDetail = (
          <li className="list-group-item" key={uniqueKey}>
            {keyControl}{valueControl}
          </li>
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

  renderComputers() {
    const result = []
    const computers = this.computers || []
    for (let i = 0; i < this.state.slots.length; i++) {
      const slot = this.state.slots[i];
      if (computers.indexOf(slot.details.computername) === -1) {
        if (slot.details.hostname && slot.details.computername && slot.details.name) {
          const uniqueKey = slot.details.hostname + '_' + slot.details.computername + '_' + slot.details.name + i
          result.push(
            <div key={uniqueKey} className="col-sm">
              <ul className="list-group" data-toggle="toggle">
                <li className="list-group-item">
                  <h2>
                    <i class="fas fa-server"></i> {slot.details.computername}
                  </h2>
                </li>
              </ul>
              {this.renderSlots(slot.details.computername)}
            </div>
          )
          computers.push(slot.details.computername)
        }
      }
    }
    return result
  }

  renderSlots(computername) {
    const result = []

    for (let i = 0; i < this.state.slots.length; i++) {
      const slot = this.state.slots[i];
      if (slot.details.computername === computername && slot.details.hostname && slot.details.computername && slot.details.name) {
        const uniqueKey = slot.details.hostname + '_' + slot.details.computername + '_' + slot.details.name + i
        result.push(
          <div key={uniqueKey} className="col-sm">
            <ul className="list-group">
              <button href={"#" + uniqueKey} className={"btn btn-primary btn-" + slot.details.valid_state} data-toggle={"collapse"}>
                {slot.details.name}
              </button>
              <div id={uniqueKey} className="collapse">
                <ul className="list-group-item">
                  {this.renderSlotDetails(slot)}
                </ul>
              </div>
              <div className="list-group-item">
                <i class="fas fa-terminal"></i> {slot.details.computername}/{(slot.details.sender || '?')}
              </div>
            </ul>
          </div>
        )
      }
    }
    return result
  }

  render() {
    /* beautify preserve:start */
    return (<div className="App">
      <div className="container">
        <div className="row">
          {this.renderComputers()}
        </div>
      </div>
    </div>
    );
    /* beautify preserve:end */
  }
}

export default App;


