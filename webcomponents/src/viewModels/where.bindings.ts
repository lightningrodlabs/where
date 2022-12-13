import {ActionHashB64, AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";

export interface Here {
  value: string,
  sessionEh: EntryHashB64,
  meta: Dictionary<string>,
}

export interface PlacementSession {
  name: string,
  index: number,
  spaceEh: EntryHashB64,
}


export interface AddHereInput {
  spaceEh: EntryHashB64,
  sessionIndex: number,
  value: string,
  meta: Dictionary<string>
}


export interface HereOutput {
  entry: Here,
  linkAh: ActionHashB64,
  author: AgentPubKeyB64,
}
