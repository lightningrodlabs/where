import {AgentPubKeyB64, ActionHashB64, EntryHashB64, Dictionary} from "@holochain-open-dev/core-types";
import {HereEntry, HereOutput} from "./where.bindings";
import {MarkerType} from "./playset.perspective";
import {EmojiGroupVariant, MarkerPiece, SpaceEntry, SvgMarkerVariant} from "./playset.bindings";
import {HoloHashedB64, mapReplacer, mapReviver} from "../utils";
import {PlaysetEntry} from "./ludotheque.bindings";



/** */
export interface WherePerspective {
  plays: Dictionary<Play>,
  sessions: Dictionary<EntryHashB64[]>,
  currentSessions: Dictionary<EntryHashB64>,
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


/** -- Conversions -- */


/** */
export function spaceFromEntry(entry: SpaceEntry): Space {
  return {
    name: entry.name,
    origin: entry.origin,
    surface: JSON.parse(entry.surface),
    maybeMarkerPiece: entry.maybeMarkerPiece,
    meta: entry.meta ? metaFromEntry(entry.meta) : defaultPlayMeta(),
  }
}

/** */
export function spaceIntoEntry(space: Space): SpaceEntry {
  return {
    name: space.name,
    origin: space.origin,
    surface: JSON.stringify(space.surface),
    maybeMarkerPiece: space.maybeMarkerPiece,
    meta: metaIntoEntry(space.meta)
  }
}

/** */
export function metaFromEntry(meta: Dictionary<string>): PlayMeta {
  let spaceMeta: any = {};
  try {
    for (const [key, value] of Object.entries(meta)) {
      Object.assign(spaceMeta, {[key]: JSON.parse(value, mapReviver)})
    }
  } catch (e) {
    console.error("Failed parsing meta filed into PlayMeta")
    console.error(e)
  }
  //console.log({spaceMeta})
  return spaceMeta as PlayMeta;
}

/** */
export function metaIntoEntry(playMeta: PlayMeta): Dictionary<string> {
  let dic: Dictionary<string> = {};
  for (const [key, value] of Object.entries(playMeta)) {
    dic[key] = JSON.stringify(value, mapReplacer)
  }
  //console.log({dic})
  return dic
}

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


/** */
export function createPlayset(name: string, spaces: HoloHashedB64<SpaceEntry>[]): PlaysetEntry {
  console.log("newPlayset() called:")
  console.log({spaces})
  /* Get templates */
  let templates = new Array();
  for (const space of spaces) {
    if (!templates.includes(space.content.origin)) {
      templates.push(space.content.origin)
    }
  }
  /* Get markers */
  let svgMarkers = new Array();
  let emojiGroups = new Array();
  for (const entry of spaces) {
    let space = spaceFromEntry(entry.content);
    if (space.meta.markerType == MarkerType.SvgMarker) {
      let markerEh = (space.maybeMarkerPiece! as SvgMarkerVariant).svg;
      if (markerEh && !svgMarkers.includes(markerEh)) {
        svgMarkers.push(markerEh)
      }
    } else {
      if (space.meta.markerType == MarkerType.EmojiGroup) {
        let eh = (space.maybeMarkerPiece! as EmojiGroupVariant).emojiGroup;
        if (eh && !svgMarkers.includes(eh)) {
          emojiGroups.push(eh)
        }
      }
    }

  }
  /* Get space hashes */
  let spaceEhs = new Array();
  for (const space of spaces) {
    spaceEhs.push(space.hash)
  }
  /* - Create PlaysetEntry */
  return {
    name,
    description: "",
    spaces: spaceEhs,
    templates,
    svgMarkers,
    emojiGroups,
  } as PlaysetEntry;
}
