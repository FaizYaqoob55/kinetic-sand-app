// src/services/FluidNCService.js
// Complete FluidNC ESP32 Communication Service

import axios from 'axios';

class FluidNCService {
  constructor() {
    this.baseURL = null;
    this.isConnected = false;
    this.timeout = 5000;
  }

  setIP(ip) {
    this.baseURL = `http://${ip}`;
    this.isConnected = true;
  }

  disconnect() {
    this.baseURL = null;
    this.isConnected = false;
  }

  // ─── PING / CHECK CONNECTION ───────────────────────────────────────
  async ping() {
    try {
      const res = await axios.get(`${this.baseURL}/`, { timeout: 3000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  // ─── AUTO DISCOVER ESP32 ON NETWORK ────────────────────────────────
  async autoDiscover() {
    const subnets = ['192.168.1', '192.168.0', '10.0.0'];
    for (const subnet of subnets) {
      const promises = [];
      for (let i = 1; i < 255; i++) {
        const ip = `${subnet}.${i}`;
        promises.push(
          axios.get(`http://${ip}/`, { timeout: 800 })
            .then(res => {
              const data = res.data;
              if (typeof data === 'string' && data.includes('FluidNC')) {
                return ip;
              }
              return null;
            })
            .catch(() => null)
        );
      }
      const results = await Promise.all(promises);
      const found = results.find(ip => ip !== null);
      if (found) return found;
    }
    return null;
  }

  // ─── SEND GCODE COMMAND ────────────────────────────────────────────
  async sendCommand(cmd) {
    if (!this.isConnected) throw new Error('Not connected');
    try {
      const res = await axios.get(
        `${this.baseURL}/command?commandText=${encodeURIComponent(cmd)}`,
        { timeout: this.timeout }
      );
      return res.data;
    } catch (err) {
      throw new Error(`Command failed: ${err.message}`);
    }
  }

  // ─── UPLOAD GCODE FILE ─────────────────────────────────────────────
  async uploadPattern(filename, gcodeContent) {
    if (!this.isConnected) throw new Error('Not connected');
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: `data:text/plain;base64,${btoa(gcodeContent)}`,
        type: 'text/plain',
        name: filename,
      });
      const res = await axios.post(`${this.baseURL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      return res.data;
    } catch (err) {
      throw new Error(`Upload failed: ${err.message}`);
    }
  }

  // ─── RUN A PATTERN ─────────────────────────────────────────────────
  async runPattern(filename) {
    return this.sendCommand(`[ESP220]/${filename}`);
  }

  // ─── PLAYBACK CONTROLS ─────────────────────────────────────────────
  async pause() {
    return this.sendCommand('!'); // Feed hold
  }

  async resume() {
    return this.sendCommand('~'); // Cycle start
  }

  async stop() {
    await this.sendCommand('\x18'); // Soft reset
    await this.sendCommand('$X');  // Kill alarm
  }

  async home() {
    return this.sendCommand('$H');
  }

  // ─── SPEED CONTROL ─────────────────────────────────────────────────
  async setSpeed(percentage) {
    // Feed override: 10%-200%
    const feedRate = Math.round(percentage * 2); // 0-100% → 0-200%
    return this.sendCommand(`F${feedRate}`);
  }

  async setFeedOverride(value) {
    // value: 10-200%
    return this.sendCommand(`[ESP220]F${value}`);
  }

  // ─── LED CONTROL ───────────────────────────────────────────────────
  async setLEDColor(r, g, b) {
    // Using M150 GCode for RGB LEDs
    return this.sendCommand(`M150 R${r} G${g} B${b}`);
  }

  async setLEDBrightness(brightness) {
    // 0-255
    return this.sendCommand(`M150 P${brightness}`);
  }

  async setLEDEffect(effect) {
    // effect: 'solid', 'pulse', 'rainbow', 'cycle'
    const effectCodes = { solid: 0, pulse: 1, rainbow: 2, cycle: 3 };
    return this.sendCommand(`M150 E${effectCodes[effect] || 0}`);
  }

  async turnOffLED() {
    return this.sendCommand('M150 R0 G0 B0');
  }

  // ─── GET STATUS ────────────────────────────────────────────────────
  async getStatus() {
    try {
      const res = await this.sendCommand('?');
      return this.parseStatus(res);
    } catch {
      return null;
    }
  }

  parseStatus(statusStr) {
    if (!statusStr) return null;
    const match = statusStr.match(/<(\w+)\|/);
    const state = match ? match[1] : 'Unknown';
    return { state, raw: statusStr };
  }

  // ─── GET FILE LIST ─────────────────────────────────────────────────
  async getFileList() {
    try {
      const res = await axios.get(`${this.baseURL}/files`, {
        timeout: this.timeout,
      });
      return res.data;
    } catch {
      return [];
    }
  }

  // ─── DELETE FILE ───────────────────────────────────────────────────
  async deleteFile(filename) {
    try {
      const res = await axios.delete(
        `${this.baseURL}/files?path=/${filename}`,
        { timeout: this.timeout }
      );
      return res.data;
    } catch (err) {
      throw new Error(`Delete failed: ${err.message}`);
    }
  }

  // ─── GET WIFI INFO ─────────────────────────────────────────────────
  async getWifiInfo() {
    try {
      const res = await axios.get(`${this.baseURL}/command?commandText=[ESP111]`, {
        timeout: this.timeout,
      });
      return res.data;
    } catch {
      return null;
    }
  }

  // ─── CHECK IF PLAYING ──────────────────────────────────────────────
  async isPlaying() {
    const status = await this.getStatus();
    return status?.state === 'Run';
  }

  // ─── SET SLEEP TIMER ───────────────────────────────────────────────
  async setSleepTimer(minutes) {
    // Custom command to ESP32
    return this.sendCommand(`[ESP800]SLEEP=${minutes}`);
  }
}

export default new FluidNCService();
