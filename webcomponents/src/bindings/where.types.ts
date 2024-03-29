/* This file is generated by zits. Do not edit manually */

import {
/** types.ts */
HoloHash,
AgentPubKey,
DnaHash,
WasmHash,
EntryHash,
ActionHash,
AnyDhtHash,
ExternalHash,
KitsuneAgent,
KitsuneSpace,
HoloHashB64,
AgentPubKeyB64,
DnaHashB64,
WasmHashB64,
EntryHashB64,
ActionHashB64,
AnyDhtHashB64,
InstalledAppId,
Signature,
CellId,
DnaProperties,
RoleName,
InstalledCell,
Timestamp,
Duration,
HoloHashed,
NetworkInfo,
FetchPoolInfo,
/** hdk/action.ts */
SignedActionHashed,
RegisterAgentActivity,
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
/** hdk/capabilities.ts */
CapSecret,
CapClaim,
GrantedFunctionsType,
GrantedFunctions,
ZomeCallCapGrant,
CapAccessType,
CapAccess,
CapGrant,
///** hdk/countersigning.ts */
//CounterSigningSessionData,
//PreflightRequest,
//CounterSigningSessionTimes,
//ActionBase,
//CounterSigningAgents,
//PreflightBytes,
//Role,
//CountersigningAgentState,
/** hdk/dht-ops.ts */
DhtOpType,
DhtOp,
getDhtOpType,
getDhtOpAction,
getDhtOpEntry,
getDhtOpSignature,
/** hdk/entry.ts */
EntryVisibility,
AppEntryDef,
EntryType,
EntryContent,
Entry,
/** hdk/record.ts */
Record as HcRecord,
RecordEntry as HcRecordEntry,
/** hdk/link.ts */
AnyLinkableHash,
ZomeIndex,
LinkType,
LinkTag,
RateWeight,
RateBucketId,
RateUnits,
Link,
/** api/admin/types.ts */
InstalledAppInfoStatus,
DeactivationReason,
DisabledAppReason,
StemCell,
ProvisionedCell,
ClonedCell,
CellType,
CellInfo,
AppInfo,
MembraneProof,
FunctionName,
ZomeName,
ZomeDefinition,
IntegrityZome,
CoordinatorZome,
DnaDefinition,
ResourceBytes,
ResourceMap,
CellProvisioningStrategy,
CellProvisioning,
DnaVersionSpec,
DnaVersionFlexible,
AppRoleDnaManifest,
AppRoleManifest,
AppManifest,
AppBundle,
AppBundleSource,
NetworkSeed,
ZomeLocation,
   } from '@holochain/client';

import {
/** Common */
DhtOpHashB64,
//DnaHashB64, (duplicate)
//AnyDhtHashB64, (duplicate)
DhtOpHash,
/** DnaFile */
DnaFile,
DnaDef,
Zomes,
WasmCode,
/** entry-details */
EntryDetails,
RecordDetails,
Details,
DetailsType,
EntryDhtStatus,
/** Validation */
ValidationStatus,
ValidationReceipt,
   } from '@holochain-open-dev/core-types';

export interface AddHereInput {
  spaceEh: EntryHashB64
  sessionIndex: number
  value: string
  meta: Record<string, string>
}

/** Input to update a Here */
export interface UpdateHereInput {
  oldHereAh: ActionHashB64
  newHere: AddHereInput
}

/** Input to the create channel call */
export interface HereOutput {
  entry: Here
  linkAh: ActionHashB64
  author: AgentPubKeyB64
}

export const PLAYSET_DEFAULT_COORDINATOR_ZOME_NAME = "where_playset";

export interface GetSessionInput {
  spaceEh: EntryHashB64
  index: number
}

export interface SpaceSessionsInput {
  sessionNames: string[]
  spaceEh: EntryHashB64
}

export interface CreateNextSessionInput {
  name: string
  spaceEh: EntryHashB64
}

/**
 * 
 * Messages sent by UI ONLY
 * 
 */
export enum MessageType {
	Ping = 'Ping',
	Pong = 'Pong',
	NewHere = 'NewHere',
	DeleteHere = 'DeleteHere',
	UpdateHere = 'UpdateHere',
	NewSession = 'NewSession',
	NewSpace = 'NewSpace',
	NewTemplate = 'NewTemplate',
	NewSvgMarker = 'NewSvgMarker',
	NewEmojiGroup = 'NewEmojiGroup',
}
export type Message = 
 | {type: "Ping", content: AgentPubKeyB64}
 | {type: "Pong", content: AgentPubKeyB64}
 | {type: "NewHere", content: HereOutput}
 | {type: "DeleteHere", content: [EntryHashB64, ActionHashB64]}
 | {type: "UpdateHere", content: [number, ActionHashB64, Here]}
 | {type: "NewSession", content: [EntryHashB64, PlacementSession]}
 | {type: "NewSpace", content: EntryHashB64}
 | {type: "NewTemplate", content: EntryHashB64}
 | {type: "NewSvgMarker", content: EntryHashB64}
 | {type: "NewEmojiGroup", content: EntryHashB64}


export interface SignalPayload {
  maybeSpaceHash?: EntryHashB64
  /** used for filtering by space if applicable */
  from: AgentPubKeyB64
  message: Message
}

/** Input to the notify call */
export interface NotifyInput {
  signal: SignalPayload
  peers: AgentPubKeyB64[]
}

export interface PlacementSession {
  name: string
  index: number
  spaceEh: EntryHashB64
}

/** Here entry definition */
export interface Here {
  value: string
  sessionEh: EntryHashB64
  meta: Record<string, string>
}

/**
 * -------------------------------------------------------------------------------------------------
 * Global consts
 * -------------------------------------------------------------------------------------------------
 * DNA/Zome names
 */
export const WHERE_DEFAULT_ROLE_NAME = "rWhere";

export const WHERE_DEFAULT_COORDINATOR_ZOME_NAME = "zWhere";

export const WHERE_DEFAULT_INTEGRITY_ZOME_NAME = "where_integrity";

export enum WhereEntryType {
	Here = 'Here',
	PlacementSession = 'PlacementSession',
}
export type WhereEntryVariantHere = {Here: Here}
export type WhereEntryVariantPlacementSession = {PlacementSession: PlacementSession}
export type WhereEntry = 
 | WhereEntryVariantHere | WhereEntryVariantPlacementSession;

/**
 * -------------------------------------------------------------------------------------------------
 * Declaration of this zome's link types
 * -------------------------------------------------------------------------------------------------
 * List of all link kinds handled by this Zome
 */
export type WhereLinkType =
  | {All: null} | {Hide: null};
export enum WhereLinkTypeType {
	All = 'All',
	Hide = 'Hide',
}
