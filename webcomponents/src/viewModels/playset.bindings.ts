/** Should be generated bindings from Rust */

import {Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";


export type SvgMarkerVariant = {svg: EntryHashB64}
export type EmojiGroupVariant = {emojiGroup: EntryHashB64}
export type MarkerPiece = SvgMarkerVariant | EmojiGroupVariant


export enum PieceType {
  Template = 'Template',
  Space = 'Space',
  SvgMarker = 'SvgMarker',
  EmojiGroup = 'EmojiGroup'
}



export interface Space {
  name: string;
  origin: EntryHashB64;
  surface: string;
  maybeMarkerPiece?: MarkerPiece;
  meta?: Dictionary<string>;
}


export interface Template {
  name: string;
  surface: string;
}

export interface SvgMarker {
  name: string;
  value: string;
}

export interface EmojiGroup {
  name: string,
  description: string,
  unicodes: string[],
}

export interface GetInventoryOutput {
  templates: EntryHashB64[];
  svgMarkers: EntryHashB64[];
  emojiGroups: EntryHashB64[];
  spaces: EntryHashB64[];
}
