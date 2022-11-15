import {Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {
  EmojiGroupEntry,
  GetInventoryOutput,
  MarkerPiece,
  SpaceEntry,
  SvgMarkerEntry,
  TemplateEntry
} from "./playset.bindings";

export type Inventory = GetInventoryOutput;

/** */
export interface PlaysetPerspective {
  /** SvgMarkerEh -> SvgMarker */
  svgMarkers: Dictionary<SvgMarkerEntry>,
  /** EmojiGroupEh -> EmojiGroup */
  emojiGroups: Dictionary<EmojiGroupEntry>,
  /** TemplateEh -> Template */
  templates: Dictionary<TemplateEntry>,
  /** SpaceEh -> Space */
  spaces: Dictionary<SpaceEntry>,
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
