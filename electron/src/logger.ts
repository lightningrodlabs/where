//import {HAPP_BUILD_MODE, HappBuildModeType} from "@ddd-qc/lit-happ";

export const electronLogger = require('electron-log');

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


const hasDebugLogs = process.env.HAPP_BUILD_MODE != 'Retail'; //HappBuildModeType.Release;

if (hasDebugLogs) {
  electronLogger.transports.file.level = 'error'; // minimize disk writes ; Use console instead
  electronLogger.transports.console.level = 'debug';
  log('debug', "DEBUG LOGS ENABLED\n");
  // require('electron-debug')({ isEnabled: true });
} else {
  //log('info', "DEBUG MODE DISABLED");
  electronLogger.transports.console.level = 'info';
  electronLogger.transports.file.level = 'info';
}
