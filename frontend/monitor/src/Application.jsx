import React, { Component } from 'react';
import './App.css';
import Device from './Device';
import Slot from './Slot';
import Meter from './Meter';
import DownSlider from './DownSlider';


function beep() {
  var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
  snd.play();
}


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
      slots: []
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
          beep()
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

  componentDidMount() {
    const self = this
    var W3CWebSocket = window.WebSocket;
    var protocoll = window.location.protocol === 'http:' ? 'ws' : 'wss'
    var port = window.location.protocol === 'http:' ? ':5040' : '/ws'
    var client = new W3CWebSocket(`${protocoll}://${window.location.hostname}${port}`, 'echo-protocol')

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
          const uniqueKey = slot.details.hostname + '_' + slot.details.computername + '_' + slot.details.name + i
          result.push(
            <div key={'host-' + i} className="container-fluid">
              <Device server={{ hostname: slot.hostname }} >
                <a className="" data-toggle="collapse" href={'#' + uniqueKey + "_collapseExample"} role="button" aria-expanded="false" aria-controls="collapseExample">
                  <strong className={this.hasError(slot.hostname) ? 'text-danger' : 'text-success'}>
                    <i className="fas fa-server"></i> {slot.details.computername}
                    {this.renderErrors(slot.hostname)}
                  </strong>
                </a>
                <div className="collapse" id={uniqueKey + "_collapseExample"}>
                  <div className="container-fluid">
                    <div className="row">
                      {this.renderSlots(slot.details.computername)}
                    </div>
                  </div>
                </div>
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
        result.push(<Slot slot={slot} id={uniqueKey} key={uniqueKey} />)
      }
    }
    return result
  }

  render() {
    return (<div className="App">
      {this.renderComputers()}
    </div>
    );
  }
}

export default App;


