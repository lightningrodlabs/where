/* This file is generated by zits. Do not edit manually */

import {LudothequeEntry, LudothequeLinkType, ExportPlaysetInput, ImportPieceInput, PlaysetOutput, Playset, } from './ludotheque';
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
/** admin types */
ZomeName,
MembraneProof,
ZomeDefinition,
IntegrityZome,
CoordinatorZome,
DnaDefinition,
ResourceBytes,
ResourceMap,
CellProvisioning,
HoloHashB64,
DnaVersionSpec,
DnaVersionFlexible,
NetworkSeed,
ZomeLocation,
   } from '@holochain/client';

import {
// Common
Dictionary,
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

import {ZomeProxy} from '@ddd-qc/lit-happ';

/**
 *
 */
export class LudothequeProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "zLudotheque"
 
  async exportPlayset(input: ExportPlaysetInput): Promise<EntryHashB64[]> {
    return this.call('export_playset', input);
  }

  async createPlayset(input: Playset): Promise<EntryHashB64> {
    return this.call('create_playset', input);
  }

  async getPlayset(input: EntryHashB64): Promise<Playset | null> {
    return this.call('get_playset', input);
  }

  async getAllPlaysets(): Promise<PlaysetOutput[]> {
    return this.call('get_all_playsets', null);
  }
}