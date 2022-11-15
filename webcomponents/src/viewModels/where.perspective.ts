import {AgentPubKeyB64, ActionHashB64, EntryHashB64, Dictionary} from "@holochain-open-dev/core-types";
import {HereOutput, PlacementSessionEntry} from "./where.bindings";
import {MarkerType} from "./playset.perspective";
import {MarkerPiece, SpaceEntry} from "./playset.bindings";




/** A 'Location' is a deserialized 'Here' with a {x,y} object as value */


export interface LocationInfo {
  location: Location;
  linkAh: ActionHashB64;
  authorPubKey: AgentPubKeyB64;
}


export interface Location {
  coord: Coord;
  sessionEh: EntryHashB64,
  meta: LocationMeta;
}


export interface LocationMeta {
  markerType: MarkerType,
  tag: string,
  img: any,
  color: string,
  authorName: string,
  emoji: string,
  svgMarker: string,
}

export type LocOptions = {
  name: string,
  img: string,
  tag: string | null,
  emoji: string | null,
  canEdit: boolean
}

export interface Coord {
  x: number;
  y: number;
}


export interface Space {
  name: string;
  origin: EntryHashB64;
  surface: any;
  maybeMarkerPiece?: MarkerPiece;
  meta: PlayMeta;
}



export interface PlacementSession {
  name: string,
  index: number,
  locations: (LocationInfo | null)[];
}

/** A 'Play' is a live 'Space' with locations and sessions */

export interface Play {
  space: Space,
  visible: boolean;
  sessions: Dictionary<PlacementSession>,
}


export interface PlayMeta {
  ui: UiItem[],
  subMap: Map<string, string>,
  /* Marker */
  markerType: MarkerType,
  singleEmoji: string,
  //emojiGroup: EntryHashB64 | null,
  //svgMarker: EntryHashB64 | null,
  /* Tag */
  multi: boolean,
  canTag: boolean,
  tagVisible: boolean,
  tagAsMarker: boolean,
  predefinedTags: string[],
  /* Session */
  sessionCount: number,
  canModifyPast: boolean,
  sessionLabels: string[],
}



export interface UiItem {
  box: UiBox,
  style: string,
  content: string,
}


export interface UiBox {
  width: number,
  height: number,
  left: number,
  top: number,
}


export function defaultPlayMeta(): PlayMeta {
  return  {
    subMap: new Map(),
    ui: [],
    /* Marker */
    markerType: MarkerType.Avatar,
    multi: false,
    singleEmoji: "😀",
    //emojiGroup: null,
    //svgMarker: null,
    /* Tag */
    canTag: false,
    tagVisible: false,
    tagAsMarker: false,
    predefinedTags: [],
    /* Sessions */
    sessionCount: 2,
    canModifyPast: true,
    sessionLabels: [],
  } as PlayMeta
}

export function defaultLocationMeta(): LocationMeta {
  return  {
    markerType: MarkerType.Tag,
    tag: "",
    img: "",
    color: "",
    authorName: "",
    emoji: "",
    svgMarker: "",
  } as LocationMeta
}

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
