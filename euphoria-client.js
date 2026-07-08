/**
 * euphoria-client.js
 * Minimal client for a euphoria/heim chatroom (&xkcd on euphoria.leet.nu).
 * No dependencies. Works in a browser <script> tag.
 *
 * Protocol summary (heim API):
 *  - Connect to wss://euphoria.leet.nu/room/<room>/ws
 *  - Server sends ping-event{time,next} -> reply ping-reply{time}
 *  - Server then sends snapshot-event{listing, log, ...} -> session is "joined"
 *  - Server pushes send-event{data:Message} for every new message
 *  - To post a message: send a "send" command {content, parent}, get send-reply back
 *  - To set your nick: send a "nick" command {name}
 *
 * Plug into MarkovBot like:
 *
 *   const room = new EuphoriaRoom('xkcd');
 *   room.onMessage(msg => {
 *     const reply = markovBot.generate(msg.content);
 *     room.send(reply, msg.id); // reply as a thread reply to msg.id (optional)
 *   });
 *   room.connect();
 */

class EuphoriaRoom {
  /**
   * @param {string} room - room name without the & (e.g. "xkcd")
   * @param {object} opts
   * @param {string} [opts.nick] - nick to set once connected
   * @param {string} [opts.host] - defaults to euphoria.leet.nu
   * @param {boolean} [opts.autoReconnect] - defaults to true
   */
  constructor(room, opts = {}) {
    this.room = room;
    this.host = opts.host || 'euphoria.leet.nu';
    this.nick = opts.nick || null;
    this.autoReconnect = opts.autoReconnect !== false;

    this.ws = null;
    this.connected = false; // true once snapshot-event received
    this._msgId = 0;
    this._pending = new Map(); // id -> {resolve, reject}
    this._listeners = { message: [], connect: [], disconnect: [], error: [] };
    this._reconnectDelay = 1000;
  }

  // ---- public event hooks ----------------------------------------------

  /** Called with a Message object every time someone (or you) posts. */
  onMessage(fn) { this._listeners.message.push(fn); return this; }

  /** Called once the snapshot-event lands and the session is fully joined. */
  onConnect(fn) { this._listeners.connect.push(fn); return this; }

  /** Called when the socket closes. */
  onDisconnect(fn) { this._listeners.disconnect.push(fn); return this; }

  /** Called on socket/protocol errors. */
  onError(fn) { this._listeners.error.push(fn); return this; }

  // ---- connection lifecycle ----------------------------------------------

  connect() {
    const url = `wss://${this.host}/room/${this.room}/ws`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this._reconnectDelay = 1000; // reset backoff
    };

    this.ws.onmessage = (evt) => {
      let packet;
      try {
        packet = JSON.parse(evt.data);
      } catch (e) {
        this._emit('error', e);
        return;
      }
      this._handlePacket(packet);
    };

    this.ws.onclose = () => {
      this.connected = false;
      this._emit('disconnect');
      if (this.autoReconnect) {
        setTimeout(() => this.connect(), this._reconnectDelay);
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, 30000);
      }
    };

    this.ws.onerror = (e) => this._emit('error', e);

    return this;
  }

  disconnect() {
    this.autoReconnect = false;
    if (this.ws) this.ws.close();
  }

  // ---- packet handling ----------------------------------------------

  _handlePacket(packet) {
    const { type, data, id } = packet;

    switch (type) {
      case 'ping-event':
        this._sendRaw({ type: 'ping-reply', data: { time: data.time } });
        break;

      case 'snapshot-event':
        this.connected = true;
        if (this.nick) this.setNick(this.nick);
        this._emit('connect', data);
        // Replay recent history through the same message hook if useful
        (data.log || []).forEach((m) => this._emit('message', m));
        break;

      case 'send-event':
        this._emit('message', data);
        break;

      case 'send-reply':
      case 'nick-reply':
      case 'who-reply':
      case 'log-reply':
        // resolve any pending promise for this reply
        if (id && this._pending.has(id)) {
          const { resolve } = this._pending.get(id);
          this._pending.delete(id);
          resolve(data);
        }
        break;

      default:
        // bounce-event, disconnect-event, join-event, part-event, etc.
        // not needed for a basic bot, ignored here.
        break;
    }
  }

  // ---- outgoing commands ----------------------------------------------

  /** Low-level: send a raw command packet, returns a Promise of its reply. */
  _sendRaw(packet) {
    const id = String(++this._msgId);
    packet.id = id;
    const p = new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
    });
    this.ws.send(JSON.stringify(packet));
    return p;
  }

  /**
   * Post a message to the room.
   * @param {string} content
   * @param {string} [parentId] - id of message to reply to (thread), optional
   */
  send(content, parentId = null) {
    return this._sendRaw({
      type: 'send',
      data: { content, parent: parentId || undefined },
    });
  }

  /** Set/change the bot's nick. */
  setNick(name) {
    this.nick = name;
    return this._sendRaw({ type: 'nick', data: { name } });
  }

  // ---- internal event emitter ----------------------------------------------

  _emit(evt, payload) {
    for (const fn of this._listeners[evt]) {
      try {
        fn(payload);
      } catch (e) {
        console.error(`EuphoriaRoom listener error (${evt}):`, e);
      }
    }
  }
}

// Expose for both <script> global use and module bundlers.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EuphoriaRoom;
}
