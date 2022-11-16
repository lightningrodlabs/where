import {ActionHashB64, AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {HereOutput, PlacementSessionEntry} from "./where.bindings";


export type WhereSignal =
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: { type: "Ping", content: AgentPubKeyB64 }
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: { type: "Pong", content: AgentPubKeyB64 }
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "NewHere", content:  HereOutput}
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "DeleteHere", content: [EntryHashB64, ActionHashB64]}
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "NewSession", content: [EntryHashB64, PlacementSessionEntry]}
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "NewSpace", content: EntryHashB64}
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "NewTemplate", content: EntryHashB64}
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "NewEmojiGroup", content: EntryHashB64}
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: { type: "NewSvgMarker", content: EntryHashB64 }
}
