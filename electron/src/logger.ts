export const electronLogger = require('electron-log');
const {IS_DEBUG} = require('./constants');

export function log(level, message) {
  electronLogger[level](message);
}
//module.exports.log = log;
module.exports.logger = electronLogger;


/**  SET UP LOGGING */

electronLogger.transports.console.format = '[{h}:{i}:{s}][{level}] {text}';
electronLogger.transports.file.format = '[{h}:{i}:{s}][{level}] {text}';
//electronLogger.info('%cRed text. %cGreen text', 'color: red', 'color: green')

log('info', "");
log('info', "");
log('info', "APP STARTED");
log('info', "");

if (IS_DEBUG) {
  electronLogger.transports.file.level = 'error';
  log('info', "DEBUG MODE ENABLED");
  // require('electron-debug')({ isEnabled: true });
} else {
  electronLogger.transports.console.level = 'info';
  electronLogger.transports.file.level = 'info';
}
