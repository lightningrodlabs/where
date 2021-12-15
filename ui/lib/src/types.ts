// TODO: add globally available interfaces for your elements

import { AgentPubKeyB64, HeaderHashB64, EntryHashB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@lit-labs/context";
import { WhereStore } from "./where.store";

export const whereContext : Context<WhereStore> = createContext('hc_zome_where/service');

export type Dictionary<T> = { [key: string]: T };


/** A 'Location' is a deserialized 'Here' with a {x,y} object as value */

export interface LocationInfo {
  location: Location;
  hash: HeaderHashB64;
  authorPubKey: AgentPubKeyB64;
}

export interface HereInfo {
  entry: HereEntry,
  hash: HeaderHashB64;
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
  meta: Dictionary<string>;
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

export interface PlacementSessionEntry {
  name: string,
  index: number,
  spaceEh: EntryHashB64,
}

export interface SpaceEntry {
  name: string;
  origin: EntryHashB64;
  surface: string;
  meta?: Dictionary<string>;
}

export interface Space  {
  name: string;
  origin: EntryHashB64;
  surface: any;
  visible: boolean;
  locations: (LocationInfo | null)[];
  meta: SpaceMeta;
}


export interface SpaceMeta {
  ui: UiItem[],
  subMap: Map<string, string>,
  // Marker
  markerType: MarkerType,
  singleEmoji: string,
  emojiGroup: EntryHashB64 | null,
  svgMarker: EntryHashB64 | null,
  // Tag
  multi: boolean,
  canTag: boolean,
  tagVisible: boolean,
  tagAsMarker: boolean,
  predefinedTags: string[],
  // Slider
  canSlider: boolean,
  sliderAxisLabel: string,
  stopCount: number,
  canModifyPast: boolean,
  stopLabels: string[],
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
  SvgMarker,
  Initials,
  SingleEmoji,
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
    spaceHash: EntryHashB64, from: AgentPubKeyB64, message: { type: "Ping", content: AgentPubKeyB64 }
  }
  | {
  spaceHash: EntryHashB64, from: AgentPubKeyB64, message: { type: "Pong", content: AgentPubKeyB64 }
}
    | {
    spaceHash: EntryHashB64, from: AgentPubKeyB64, message: {type: "NewSpace", content:  SpaceEntry}
  }
    | {
    spaceHash: EntryHashB64, from: AgentPubKeyB64, message: {type: "NewHere", content:  HereInfo}
  }
    | {
    spaceHash: EntryHashB64, from: AgentPubKeyB64, message: {type: "DeleteHere", content: HeaderHashB64}
  }
    | {
    spaceHash: EntryHashB64, from: AgentPubKeyB64, message: {type: "NewTemplate", content: TemplateEntry}
  }
  | {
  spaceHash: EntryHashB64, from: AgentPubKeyB64, message: {type: "NewEmojiGroup", content: EmojiGroupEntry}
  }
  | {
  spaceHash: EntryHashB64, from: AgentPubKeyB64, message: { type: "NewSvgMarker", content: SvgMarkerEntry }
  }


export function defaultSpaceMeta(): SpaceMeta {
  return  {
    subMap: new Map(),
    ui: [],
    // Marker
    markerType: MarkerType.Avatar,
    multi: false,
    singleEmoji: "😀",
    emojiGroup: null,
    svgMarker: null,
    // Tag
    canTag: false,
    tagVisible: false,
    tagAsMarker: false,
    predefinedTags: [],
    // Slider
    canSlider: false,
    sliderAxisLabel: "",
    stopCount: 2,
    canModifyPast: false,
    stopLabels: [],
  } as SpaceMeta
}
