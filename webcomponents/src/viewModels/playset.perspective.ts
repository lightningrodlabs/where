import {
  EmojiGroup,
  GetInventoryOutput,
  MarkerPiece,
  Space,
  SvgMarker,
  Template
} from "../bindings/playset.types";
import {mapReplacer, mapReviver} from "../utils";
import {EntryHashB64} from "@holochain/client";
import {Dictionary} from "@ddd-qc/cell-proxy";

export type Inventory = GetInventoryOutput;

/** */
export interface PlaysetPerspective {
  /** SvgMarkerEh -> SvgMarker */
  svgMarkers: Dictionary<SvgMarker>,
  /** EmojiGroupEh -> EmojiGroup */
  emojiGroups: Dictionary<EmojiGroup>,
  /** TemplateEh -> Template */
  templates: Dictionary<Template>,
  /** SpaceEh -> Space */
  spaces: Dictionary<SpaceMat>,
}


export interface SpaceMat {
  name: string;
  origin: EntryHashB64;
  surface: any;
  maybeMarkerPiece?: MarkerPiece;
  meta: SpaceMeta;
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

export const markerTypeNames = [
  "AnyEmoji",
  "Avatar",
  "Initials",
  "SingleEmoji",
  "SvgMarker",
  "EmojiGroup",
  "Tag",
];

export enum TemplateType {
  Html = 'html',
  Svg = 'svg',
  Canvas = 'canvas',
}




export interface SpaceMeta {
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


export function defaultSpaceMeta(): SpaceMeta {
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
  }
}


/** */
export function materializeSpace(entry: Space): SpaceMat {
  return {
    name: entry.name,
    origin: entry.origin,
    surface: JSON.parse(entry.surface),
    maybeMarkerPiece: entry.maybeMarkerPiece,
    meta: entry.meta ? convertFieldToMeta(entry.meta) : defaultSpaceMeta(),
  }
}

/** */
export function dematerializeSpace(space: SpaceMat): Space {
  return {
    name: space.name,
    origin: space.origin,
    surface: JSON.stringify(space.surface),
    maybeMarkerPiece: space.maybeMarkerPiece,
    meta: convertMetaToField(space.meta)
  }
}


/** -- Conversions -- */

/** */
export function convertMetaToField(spaceMeta: SpaceMeta): Dictionary<string> {
  let dic: Dictionary<string> = {};
  for (const [key, value] of Object.entries(spaceMeta)) {
    dic[key] = JSON.stringify(value, mapReplacer)
  }
  //console.log({dic})
  return dic
}


/** */
export function convertFieldToMeta(meta: Dictionary<string>): SpaceMeta {
  let spaceMeta: any = {};
  try {
    for (const [key, value] of Object.entries(meta)) {
      Object.assign(spaceMeta, {[key]: JSON.parse(value, mapReviver)})
    }
  } catch (e) {
    console.error("Failed parsing meta field into PlayMeta")
    console.error(e)
  }
  //console.log({spaceMeta})
  return spaceMeta as SpaceMeta;
}
