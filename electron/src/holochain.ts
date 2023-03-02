import * as path from 'path'
import { app } from 'electron'
import { ElectronHolochainOptions, StateSignal, PathOptions } from '@lightningrodlabs/electron-holochain'
import {MAIN_APP_ID, COMMUNITY_PROXY_URL, getAdminPort} from './constants'

// these messages get seen on the splash page
export enum StateSignalText {
  IsFirstRun = 'Welcome to Where...',
  IsNotFirstRun = 'Loading...',
  CreatingKeys = 'Creating cryptographic keys...',
  RegisteringDna = 'Registering Profiles DNA to Holochain...',
  InstallingApp = 'Installing DNA bundle to Holochain...',
  EnablingApp = 'Enabling DNA...',
  AddingAppInterface = 'Attaching API network port...',
}

export function stateSignalToText(state: StateSignal): StateSignalText {
  switch (state) {
    case StateSignal.IsFirstRun:
      return StateSignalText.IsFirstRun
    case StateSignal.IsNotFirstRun:
      return StateSignalText.IsNotFirstRun
    case StateSignal.CreatingKeys:
      return StateSignalText.CreatingKeys
    case StateSignal.RegisteringDna:
      return StateSignalText.RegisteringDna
    case StateSignal.InstallingApp:
      return StateSignalText.InstallingApp
    case StateSignal.EnablingApp:
      return StateSignalText.EnablingApp
    case StateSignal.AddingAppInterface:
      return StateSignalText.AddingAppInterface
  }
}

const DNA_PATH = app.isPackaged
  ? path.join(app.getAppPath(), '../app/bin/where.happ')
  : path.join(app.getAppPath(), '../artifacts/where.happ')

//console.log({whereDnaPath})

// in production
// must point to unpacked versions, not in an asar archive
// in development
// fall back on defaults in the electron-holochain package
const fileExt = process.platform === 'win32' ? '.exe' : '';
const BINARY_PATHS: PathOptions | undefined = app.isPackaged
  ? {
      holochainRunnerBinaryPath: path.join(
        __dirname,
        `../../app/bin/holochain-runner${fileExt}`
      ),
      // lairKeystoreBinaryPath: path.join(
      //   __dirname,
      //   `../../app/bin/lair-keystore${fileExt}`,
      // ),
    }
  : undefined

//console.log({BINARY_PATHS})

/**
 *
 */
async function createHolochainOptions(uid: string, storagePath: string): Promise<ElectronHolochainOptions> {
  const options:  ElectronHolochainOptions = {
    happPath: DNA_PATH,
    datastorePath: path.join(storagePath, 'databases-' + app.getVersion()),
    keystorePath: path.join(storagePath, 'keystore-' + app.getVersion()),
    appId: MAIN_APP_ID + '-' + uid,
    //appId: MAIN_APP_ID,
    appWsPort: 0,
    adminWsPort: await getAdminPort(),
    //proxyUrl: COMMUNITY_PROXY_URL,
    //bootstrapUrl: "",
    //uid,
    passphrase: "test-passphrase",
  }
  return options;
}

export { DNA_PATH, BINARY_PATHS, createHolochainOptions }
