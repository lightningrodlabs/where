import {AgentPubKeyB64, ActionHashB64, EntryHashB64, Dictionary} from "@holochain-open-dev/core-types";
import {HereEntry, HereOutput} from "./where.bindings";
import {MarkerType, Space} from "./playset.perspective";
import {mapReplacer, mapReviver} from "../utils";


/** */
export interface WherePerspective {
  /* SpaceEh -> [sessions] */
  manifests: Dictionary<PlayManifest>,
  /** SessionEh -> PlacementSession */
  sessions: Dictionary<PlacementSession>,
}


/** A 'Play' is a live 'Space' with locations and sessions */
export interface Play {
  space: Space,
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
export interface PlacementSession {
  name: string,
  index: number,
  locations: (LocationInfo | null)[];
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



/** */
export function defaultLocationMeta(): LocationMeta {
  return  {
    markerType: MarkerType.Tag,
    tag: "",
    img: "",
    color: "",
    authorName: "",
    emoji: "",
    svgMarker: "",
  }
}


/** -- Conversions -- */

/** */
export function convertHereToLocation(info: HereInfo) : LocationInfo {
  let locationMeta:any = {};
  try {
    for (const [key, value] of Object.entries(info.entry.meta)) {
      Object.assign(locationMeta, {[key]: JSON.parse(value, mapReviver)})
    }
  } catch (e) {
    console.error("Failed parsing meta filed into LocationMeta")
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
export function convertLocationToHere(location: WhereLocation) : HereEntry {
  let meta: Dictionary<string> = {};
  for (const [key, value] of Object.entries(location.meta)) {
    meta[key] = JSON.stringify(value, mapReplacer)
  }
  return {
    value: JSON.stringify(location.coord),
    sessionEh: location.sessionEh,
    meta,
  } as HereEntry
}

