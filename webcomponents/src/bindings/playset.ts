/* This file is generated by zits. Do not edit manually */

import {
/** Types */
HoloHash,
AgentPubKey,
DnaHash,
WasmHash,
EntryHash,
ActionHash,
AnyDhtHash,
KitsuneAgent,
KitsuneSpace,
InstalledAppId,
Signature,
CellId,
DnaProperties,
RoleId,
InstalledCell,
Timestamp,
HoloHashed,
/** Action */
SignedActionHashed,
ActionHashed,
ActionType,
Action,
NewEntryAction,
Dna,
AgentValidationPkg,
InitZomesComplete,
CreateLink,
DeleteLink,
OpenChain,
CloseChain,
Update,
Delete,
Create,
/** Capabilities */
CapSecret,
CapClaim,
ZomeCallCapGrant,
CapAccess,
CapGrant,
/** CounterSigning */
//CounterSigningSessionData,
//PreflightRequest,
//CounterSigningSessionTimes,
//ActionBase,
//CounterSigningAgents,
//PreflightBytes,
//Role,
//CountersigningAgentState,
/** DhtOps */
DhtOpType,
DhtOp,
getDhtOpType,
getDhtOpAction,
getDhtOpEntry,
getDhtOpSignature,
/** Entry */
EntryVisibility,
AppEntryType,
EntryType,
EntryContent,
Entry,
/** Record */
Record,
RecordEntry,
   } from '@holochain/client';

import {
// Common
Dictionary,
HoloHashB64,
EntryHashB64,
ActionHashB64,
DhtOpHashB64,
DnaHashB64,
AgentPubKeyB64,
AnyDhtHashB64,
DhtOpHash,
// DnaFile
DnaFile,
DnaDef,
Zomes,
WasmCode,
// entry-details
EntryDetails,
RecordDetails,
Details,
DetailsType,
EntryDhtStatus,
// Validation
ValidationStatus,
ValidationReceipt,
   } from '@holochain-open-dev/core-types';

export interface ExportPieceInput {
  cellId: CellId
  pieceEh: EntryHashB64
  pieceTypeName: string
}

export interface ExportSpaceInput {
  cellId: CellId
  spaceEh: EntryHashB64
}

export interface GetInventoryOutput {
  templates: EntryHashB64[]
  svgMarkers: EntryHashB64[]
  emojiGroups: EntryHashB64[]
  spaces: EntryHashB64[]
}

export interface ImportPieceInput {
  piece_type_name: string
  piece_entry: Entry
}

export interface EmojiGroupOutput {
  hash: EntryHashB64
  content: EmojiGroup
}

/**  */
export interface SpaceOutput {
  hash: EntryHashB64
  content: Space
}

export interface SvgMarkerOutput {
  hash: EntryHashB64
  content: SvgMarker
}

export interface TemplateOutput {
  hash: EntryHashB64
  content: Template
}

export enum PlaysetEntryType {
	SvgMarker = 'SvgMarker',
	EmojiGroup = 'EmojiGroup',
	Template = 'Template',
	Space = 'Space',
}
export type PlaysetEntryVariantSvgMarker = {svgMarker: SvgMarker}
export type PlaysetEntryVariantEmojiGroup = {emojiGroup: EmojiGroup}
export type PlaysetEntryVariantTemplate = {template: Template}
export type PlaysetEntryVariantSpace = {space: Space}
export type PlaysetEntry = 
 | PlaysetEntryVariantSvgMarker | PlaysetEntryVariantEmojiGroup | PlaysetEntryVariantTemplate | PlaysetEntryVariantSpace;

/** EmojiGroup Entry */
export interface EmojiGroup {
  name: string
  description: string
  unicodes: string[]
}

export enum MarkerPieceType {
	Svg = 'Svg',
	EmojiGroup = 'EmojiGroup',
}
export type MarkerPieceVariantSvg = {svg: EntryHashB64}
export type MarkerPieceVariantEmojiGroup = {emojiGroup: EntryHashB64}
export type MarkerPiece = 
 | MarkerPieceVariantSvg | MarkerPieceVariantEmojiGroup;

/** Space entry definition */
export interface Space {
  name: string
  origin: EntryHashB64
  surface: string
  maybeMarkerPiece?: MarkerPiece
  meta: Dictionary<string>
}

/** SvgMarker Entry */
export interface SvgMarker {
  name: string
  value: string
}

/** Template Entry */
export interface Template {
  name: string
  surface: string
}
