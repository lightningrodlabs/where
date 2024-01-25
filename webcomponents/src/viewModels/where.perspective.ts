import {Here, HereOutput, PlacementSession} from "../bindings/where.types";
import {MarkerType, SpaceMat} from "./playset.perspective";
import {mapReplacer, mapReviver} from "../utils";
import {ActionHashB64, AgentPubKeyB64, EntryHashB64} from "@holochain/client";
import {Dictionary} from "@ddd-qc/cell-proxy";
import {Hrl, HrlWithContext} from "@lightningrodlabs/we-applet";


/** */
export interface WherePerspective {
  /* SpaceEh -> [sessions] */
  manifests: Dictionary<PlayManifest>,
  /** SessionEh -> PlacementSession */
  sessions: Dictionary<PlacementSessionMat>,
}


/** A 'Play' is a live 'Space' with locations and sessions */
export interface Play {
  space: SpaceMat,
  //visible: boolean;
  /* SessionName -> SessionEh */
  sessions: Dictionary<EntryHashB64>,
}

/** Holds all the info to construct a Play */
export interface PlayManifest {
  spaceEh: EntryHashB64,
  visible: boolean;
  sessionEhs: EntryHashB64[],
}


/** */
export interface PlacementSessionMat {
  name: string,
  index: number,
  locations: (LocationInfo | null)[];
}

export function dematerializeSession(session: PlacementSessionMat, spaceEh: EntryHashB64): PlacementSession {
  return {
    name: session.name,
    index: session.index,
    spaceEh,
  };
}

/** A 'Location' is a deserialized 'Here' with a {x,y} object as value */

export type HereInfo = HereOutput

export interface LocationInfo {
  location: WhereLocation;
  linkAh: ActionHashB64;
  authorPubKey: AgentPubKeyB64;
}


export interface WhereLocation {
  coord: Coord;
  sessionEh: EntryHashB64,
  meta: LocationMeta;
}


export interface LocationMeta {
  markerType: MarkerType,
  attachables: HrlWithContext[],
  tag: string,
  img: any,
  color: string,
  authorName: string,
  emoji: string,
  svgMarker: string,
}

export type LocOptions = {
  attachables: HrlWithContext[] | null,
  name: string,
  img: string,
  tag: string | null,
  emoji: string | null,
  canUpdateLoc: boolean
}

export interface Coord {
  x: number;
  y: number;
}



/** */
export function defaultLocationMeta(): LocationMeta {
  return  {
    attachables: [],
    markerType: MarkerType.Tag,
    tag: "",
    img: "",
    color: "",
    authorName: "",
    emoji: "",
    svgMarker: "",
  }
}


/** -- Materialization -- */

/** */
export function materializeHere(info: HereInfo) : LocationInfo {
  let locationMeta:any = {};
  try {
    for (const [key, value] of Object.entries(info.entry.meta)) {
      Object.assign(locationMeta, {[key]: JSON.parse(value, mapReviver)})
    }
  } catch (e) {
    console.error("Failed parsing meta field into LocationMeta")
    console.error(e)
  }
  //
  return {
    location: {
      coord: JSON.parse(info.entry.value),
      sessionEh: info.entry.sessionEh,
      meta: locationMeta,
    },
    linkAh: info.linkAh,
    authorPubKey: info.author,
  }
}


/** */
export function dematerializeHere(location: WhereLocation) : Here {
  let meta: Dictionary<string> = {};
  for (const [key, value] of Object.entries(location.meta)) {
    if (value === undefined) {continue;}
    meta[key] = JSON.stringify(value, mapReplacer)
  }
  return {
    value: JSON.stringify(location.coord),
    sessionEh: location.sessionEh,
    meta,
  } as Here
}

