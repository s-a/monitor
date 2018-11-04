import React, { Component } from 'react';
import './App.css';
import Device from './Device';
import Slot from './Slot';
import Meter from './Meter';
import Expandable from './Expandable';

function upd(a, b) {
  for (var i in b) {
    if (b.hasOwnProperty(i)) {
      a[i] = b[i]
    }
  }
};



class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      log: {
        details: {}
      },
      slots: [],
      websocketConectionAttempts: 1,
      websocketState: {
        name: 'UNKNOWN',
        description: 'The status is currently unknown.',
      }
    }
  }



  upsertSlot(slotData) {
    let found = false
    const slots = this.state.slots
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      if (slot && slot.details.hostname === slotData.details.hostname && slot.details.computername === slotData.details.computername && slot.details.name === slotData.details.name) {
        // upd(slot.details, slotData.details)
        // slot.details = slotData.details || 
        if (slotData.details.valid_state !== 'danger') {
          upd(slot.details, slotData.details)
        } else {
          if (Notification.permission !== "granted")
            Notification.requestPermission();
          else {
            var notification = new Notification(slot.hostname, {
              icon: window.location.protocol + "//" + window.location.host + '/logo.png',
              body: slot.details.name.toUpperCase() + ' ' + slot.details.text,
            });

            /* notification.onclick = function () {
              window.open("http://stackoverflow.com/a/13328397/1269037");
            }; */

          }

          slot.details = slotData.details
        }
        slot.version = slotData.version
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

  muteSlots() {
    const slots = this.state.slots
    for (let s = 0; s < slots.length; s++) {
      slots[s].details.valid_state = 'secondary'
    }
    this.setState({ slots })
  }

  newWebsocketClient() {
    const self = this
    var W3CWebSocket = window.WebSocket;
    var protocoll = window.location.protocol === 'http:' ? 'ws' : 'wss'
    var port = window.location.protocol === 'http:' ? ':5040' : '/ws'
    var client = new W3CWebSocket(`${protocoll}://${window.location.hostname}${port}`, 'echo-protocol')
    client.onerror = function () {
      self.muteSlots()
      self.refreshWebsocketConnectionState()
    };

    client.onopen = function () {
      self.refreshWebsocketConnectionState()
    };

    client.onclose = function () {
      self.muteSlots()
      self.refreshWebsocketConnectionState()
    };

    client.onmessage = function (e) {
      if (typeof e.data === 'string') {
        const log = JSON.parse(e.data)
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
    return client
  }

  componentDidMount() {
    const self = this

    this.websocketClient = this.newWebsocketClient()
    window.setInterval(function () {
      self.refreshWebsocketConnectionState()
    }, 5000)

  }

  refreshWebsocketConnectionState() {
    const self = this
    let state = {
      name: 'UNKNOWN',
      description: 'The status is currently unknown.'
    }
    switch (self.websocketClient.readyState) {
      case 0:
        state = {
          name: 'CONNECTING',
          description: 'The connection is not yet open.'
        }
        break;
      case 1:
        state = {
          name: 'OPEN',
          description: 'The connection is open and ready to communicate.'
        }
        break;
      case 2:
        state = {
          name: 'CLOSING',
          description: 'The connection is in the process of closing.'
        }
        break;
      case 3:
        state = {
          name: 'CLOSED',
          description: 'The connection is closed.'
        }
        break;

      default:
        break;
    }
    self.setState({ websocketState: state, websocketConectionAttempts: self.state.websocketConectionAttempts + 1 })
    if (self.websocketClient.readyState !== 1) {
      self.websocketClient = self.newWebsocketClient()
    }
  }

  fetchSlots(hostname) {
    const result = []
    for (let i = 0; i < this.state.slots.length; i++) {
      const slot = this.state.slots[i];
      if (slot.hostname === hostname) {
        result.push(slot)
      }
    }
    return result
  }

  hasError(hostname) {
    let result = false
    const slots = this.fetchSlots(hostname)
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.details.valid_state !== 'success' && slot.details.valid_state !== 'warning') {
        result = true
        // document.getElementById('alarm-sound').play();
        // document.getElementById('alarm-sound').pause();
        break
      }
    }
    return result
  }

  fetchErrors(hostname) {
    let result = []
    const slots = this.fetchSlots(hostname)
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.details.valid_state !== 'success' && slot.details.valid_state !== 'warning') {
        result.push(slot)
        break
      }
    }
    return result
  }

  renderErrors(hostname) {
    const result = []
    const errors = this.fetchErrors(hostname)
    for (let e = 0; e < errors.length; e++) {
      const error = errors[e];
      result.push(<span key={"error-" + e}> {error.details.name} {error.details.text}</span >)
    }
    return (
      <div loop={true}>
        {result}
      </div>
    )
  }

  renderComputers() {
    const result = []
    const computers = this.computers || []

    for (let i = 0; i < this.state.slots.length; i++) {
      const slot = this.state.slots[i];
      if (computers.indexOf(slot.details.computername) === -1) {
        if (true/* slot.details.hostname && slot.details.computername && slot.details.name */) {
          result.push(
            <div key={'host-' + i} className="container-fluid">
              <Device server={{ hostname: slot.hostname }} >
                <Expandable show={true} header={(
                  <strong className={this.hasError(slot.hostname) ? 'text-danger' : 'text-success'}>
                    <i className="fas fa-server"></i> {slot.details.computername}
                    {this.renderErrors(slot.hostname)}
                  </strong>
                )}>
                  <div className="container-fluid">
                    <div className="row">
                      {this.renderSlots(slot.details.computername)}
                    </div>
                  </div>
                </Expandable>
              </Device>
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
        result.push(<Slot slot={slot} key={uniqueKey} />)
      }
    }
    return result
  }

  render() {
    return (<div className="App">
      <small>Server connection status: {this.state.websocketState.name} {this.state.websocketState.state === 0 ? `(${this.state.websocketConectionAttempts.toString()})` : ''} - {this.state.websocketState.description}</small>
      {this.renderComputers()}
    </div>
    );
  }
}

export default App;


