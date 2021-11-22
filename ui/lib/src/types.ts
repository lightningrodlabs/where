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
  meta: Dictionary<string>;
}

export interface Location {
  coord: Coord;
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
  subMap: Map<string, string>,
  markerType: MarkerType,
  multi: boolean,
  canTag: boolean,
  tagVisible: boolean,
  ui: UiItem[],
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
  Emoji,
  Avatar,
  Color,
  Letter,
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
