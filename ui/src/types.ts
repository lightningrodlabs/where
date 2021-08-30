// TODO: add globally available interfaces for your elements

import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

export const WHERE_CONTEXT = 'hc_zome_where/service';

export type Dictionary<T> = { [key: string]: T };

export interface Where {
  entry: Location;
  authorPic: string;
  authorName: string;
  authorPubkey: AgentPubKeyB64;
}

export interface Location {
  location: Coord;
  meta: string;
}
export interface Coord {
  x: number;
  y: number;
}

export interface Surface {
  url: string;
  size: Coord;
}

export interface Space {
  name: string;
  surface: Surface;
  wheres: Where[];
}

export interface CalendarEvent {
  title: string;
  createdBy: AgentPubKeyB64;
  startTime: number;
  endTime: number;
  invitees: AgentPubKeyB64[];
  location: string;
}
