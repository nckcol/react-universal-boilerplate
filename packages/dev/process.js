const { fork } = require("child_process");

function process(script, options) {
  const instance = {
    _handlers: [],
    process: null,

    _handleExit: function _handleExit() {
      this.process = null;
    },
    _handleMessage: function _handleMessage(message) {
      if (this._handlers && Array.isArray(this._handlers[message])) {
        this._handlers[message].forEach(function (handler) {
          handler();
        });
      }
    },
    _handleRestartExit: function _handleRestartExit() {
      this.start();
    },

    start: function _start() {
      this.process = fork(script, options);

      this.process.once("exit", this._handleExit.bind(this));
      this.process.on("message", this._handleMessage.bind(this));
    },

    restart: function _restart() {
      if (!this.process) {
        this.start();
        return;
      }
      this.process.once("exit", this._handleRestartExit.bind(this));
      this.process.kill("SIGUSR2");
    },

    on: function _on(message, handler) {
      if (!this._handlers[message]) {
        this._handlers[message] = [];
      }
      this._handlers[message].push(handler);
    },
  };

  return instance;
}

module.exports = process;
