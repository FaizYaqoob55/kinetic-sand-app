// src/services/WebSocketService.js
// Real-time WebSocket connection to FluidNC ESP32

class WebSocketService {
  constructor() {
    this.ws = null;
    this.ip = null;
    this.listeners = {};
    this.reconnectTimer = null;
    this.isConnecting = false;
    this.shouldReconnect = true;
    this.progress = 0;
    this.status = 'Idle';
  }

  connect(ip) {
    this.ip = ip;
    this.shouldReconnect = true;
    this._connect();
  }

  _connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(`ws://${this.ip}:81/`);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this._emit('connected', true);
        clearTimeout(this.reconnectTimer);
      };

      this.ws.onmessage = (event) => {
        this._handleMessage(event.data);
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this._emit('error', 'Connection error');
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this._emit('connected', false);
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => this._connect(), 3000);
        }
      };
    } catch (err) {
      this.isConnecting = false;
    }
  }

  _handleMessage(data) {
    // Parse FluidNC status messages
    if (typeof data === 'string') {
      // Status: <Run|MPos:1.234,5.678|FS:500,0|WCO:0,0>
      if (data.startsWith('<')) {
        const status = this._parseGrblStatus(data);
        this._emit('status', status);
        this._emit('progress', this.progress);
      }

      // Progress line numbers
      if (data.includes('line:')) {
        const match = data.match(/line:(\d+)\/(\d+)/);
        if (match) {
          this.progress = Math.round((parseInt(match[1]) / parseInt(match[2])) * 100);
          this._emit('progress', this.progress);
        }
      }

      // Pattern complete
      if (data.includes('[MSG:INFO: Finished]') || data.includes('ok')) {
        this._emit('complete', true);
      }

      // Error messages
      if (data.startsWith('error:')) {
        this._emit('error', data);
      }

      // Raw message
      this._emit('message', data);
    }
  }

  _parseGrblStatus(statusStr) {
    const stateMatch = statusStr.match(/<(\w+)\|/);
    const posMatch = statusStr.match(/MPos:([\d.-]+),([\d.-]+)/);
    const feedMatch = statusStr.match(/FS:([\d.]+),([\d.]+)/);

    return {
      state: stateMatch ? stateMatch[1] : 'Unknown',
      position: posMatch
        ? { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]) }
        : { x: 0, y: 0 },
      feed: feedMatch ? parseFloat(feedMatch[1]) : 0,
      isRunning: stateMatch ? stateMatch[1] === 'Run' : false,
      isPaused: stateMatch ? stateMatch[1] === 'Hold' : false,
      isIdle: stateMatch ? stateMatch[1] === 'Idle' : false,
    };
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = {};
    this.progress = 0;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();
