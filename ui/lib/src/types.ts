// TODO: add globally available interfaces for your elements

import { AgentPubKeyB64, HeaderHashB64, EntryHashB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@lit-labs/context";
import { WhereStore } from "./where.store";

export const whereContext : Context<WhereStore> = createContext('hc_zome_where/service');

export type Dictionary<T> = { [key: string]: T };

export interface WhereInfo {
  entry: WhereEntry,
  hash: HeaderHashB64;
  author: AgentPubKeyB64,
}

export interface WhereEntry {
  location: string;
  meta: Dictionary<string>;
}

export interface Where {
  entry: Location;
  hash: HeaderHashB64;
  authorPubKey: AgentPubKeyB64;
}

export interface Location {
  location: Coord;
  meta: Dictionary<string>;
}

export interface Coord {
  x: number;
  y: number;
}

export interface Surface {
  url: string;
  data: string;
  size: Coord;
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
  surface: Surface;
  wheres: Where[];
  meta?: Dictionary<string>;
}

export interface TemplateEntry  {
  name: string;
  surface: string;
}


export type Signal =
  | {
    spaceHash: EntryHashB64, message: {type: "NewSpace", content:  SpaceEntry}
  }
  | {
    spaceHash: EntryHashB64, message: {type: "NewWhere", content:  WhereInfo}
    }
  | {
    spaceHash: EntryHashB64, message: {type: "DeleteWhere", content: HeaderHashB64}
  }
  | {
  spaceHash: EntryHashB64, message: {type: "NewTemplate", content: TemplateEntry}
}
