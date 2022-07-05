// TODO: add globally available interfaces for your elements

import {AgentPubKeyB64, HeaderHashB64, EntryHashB64, HoloHashB64} from "@holochain-open-dev/core-types";

export type Dictionary<T> = { [key: string]: T };

export interface HoloHashed<T> {
  hash: HoloHashB64;
  content: T;
}

export enum PieceType {
  Template = 'template',
  Space = 'space',
  SvgMarker = 'SvgMarker',
  EmojiGroup = 'EmojiGroup'
}

export interface Inventory {
  templates: EntryHashB64[];
  svgMarkers: EntryHashB64[];
  emojiGroups: EntryHashB64[];
  spaces: EntryHashB64[];
}

export function count_inventory(inventory: Inventory): number {
  return inventory.templates.length
  + inventory.spaces.length
  + inventory.svgMarkers.length
  + inventory.emojiGroups.length;
}


/** A 'Location' is a deserialized 'Here' with a {x,y} object as value */

/** A 'Play' is a live 'Space' with locations and sessions */

export interface LocationInfo {
  location: Location;
  linkHh: HeaderHashB64;
  authorPubKey: AgentPubKeyB64;
}

export interface HereInfo {
  entry: HereEntry,
  linkHh: HeaderHashB64;
  author: AgentPubKeyB64,
}

export interface HereEntry {
  value: string;
  sessionEh: EntryHashB64,
  meta: Dictionary<string>;
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

export interface PlacementSession {
  name: string,
  index: number,
  locations: (LocationInfo | null)[];
}

export interface PlacementSessionEntry {
  name: string,
  index: number,
  spaceEh: EntryHashB64,
}

export type SvgMarkerVariant = {svg: EntryHashB64}
export type EmojiGroupVariant = {emojiGroup: EntryHashB64}
export type MarkerPiece = SvgMarkerVariant | EmojiGroupVariant

export interface SpaceEntry {
  name: string;
  origin: EntryHashB64;
  surface: string;
  maybeMarkerPiece?: MarkerPiece;
  meta?: Dictionary<string>;
}

export interface Space {
  name: string;
  origin: EntryHashB64;
  surface: any;
  maybeMarkerPiece?: MarkerPiece;
  meta: PlayMeta;
}

export interface Play {
  space: Space,
  visible: boolean;
  sessions: Dictionary<PlacementSession>,
}


// export interface SpaceMeta {
//   ui: UiItem[],
//   subMap: Map<string, string>,
// }


export interface PlayMeta {
  ui: UiItem[],
  subMap: Map<string, string>,
  // Marker
  markerType: MarkerType,
  singleEmoji: string,
  //emojiGroup: EntryHashB64 | null,
  //svgMarker: EntryHashB64 | null,
  // Tag
  multi: boolean,
  canTag: boolean,
  tagVisible: boolean,
  tagAsMarker: boolean,
  predefinedTags: string[],
  // Session
  sessionCount: number,
  canModifyPast: boolean,
  sessionLabels: string[],
}

export interface PlaysetEntry {
  name: string;
  description: string;
  templates: EntryHashB64[];
  svgMarkers: EntryHashB64[];
  emojiGroups: EntryHashB64[];
  spaces: EntryHashB64[];
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

export enum MarkerType {
  AnyEmoji,
  Avatar,
  Initials,
  SingleEmoji,
  SvgMarker,
  EmojiGroup,
  Tag,
}

export enum TemplateType {
  Html = 'html',
  Svg = 'svg',
  Canvas = 'canvas',
}

export interface TemplateEntry  {
  name: string;
  surface: string;
}

export interface SvgMarkerEntry  {
  name: string;
  value: string;
}

export interface EmojiGroupEntry {
  name: string,
  description: string,
  unicodes: string[],
}

export type Signal =
  | {
    maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: { type: "Ping", content: AgentPubKeyB64 }
  }
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: { type: "Pong", content: AgentPubKeyB64 }
}
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "NewHere", content:  HereInfo}
  }
  | {
  maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "DeleteHere", content: [EntryHashB64, HeaderHashB64]}
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


export function defaultPlayMeta(): PlayMeta {
  return  {
    subMap: new Map(),
    ui: [],
    // Marker
    markerType: MarkerType.Avatar,
    multi: false,
    singleEmoji: "😀",
    //emojiGroup: null,
    //svgMarker: null,
    // Tag
    canTag: false,
    tagVisible: false,
    tagAsMarker: false,
    predefinedTags: [],
    // Sessions
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
