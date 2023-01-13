/* This file is generated by zits. Do not edit manually */

import {PLAYSET_ZOME_NAME, Message, WhereEntry, WhereLinkType, AddHereInput, UpdateHereInput, HereOutput, GetSessionInput, SpaceSessionsInput, CreateNextSessionInput, SignalPayload, NotifyInput, Here, PlacementSession, } from './where.types';
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
HoloHashed,
NetworkInfo,
FetchQueueInfo,
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
GrantedFunctionsType,
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
AppEntryDef,
EntryType,
EntryContent,
Entry,
/** Record */
Record as HcRecord,
RecordEntry as HcRecordEntry,
/** admin types */
InstalledAppInfoStatus,
StemCell,
Cell,
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
CellProvisioning,
DnaVersionSpec,
DnaVersionFlexible,
NetworkSeed,
ZomeLocation,
   } from '@holochain/client';

import {
/** Common */
DhtOpHashB64,
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

import {ZomeProxy} from '@ddd-qc/lit-happ';
import {whereFunctionNames} from './where.fn';

/**
 *
 */
export class WhereProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "zWhere"
  static readonly FN_NAMES = whereFunctionNames
 
  async addHere(input: AddHereInput): Promise<ActionHashB64> {
    return this.call('add_here', input);
  }

  async updateHere(input: UpdateHereInput): Promise<ActionHashB64> {
    return this.call('update_here', input);
  }

  async deleteHere(linkAh: ActionHashB64): Promise<void> {
    return this.call('delete_here', linkAh);
  }

  async getHeres(sessionEh: EntryHashB64): Promise<HereOutput[]> {
    return this.call('get_heres', sessionEh);
  }

  async hideSpace(spaceEh64: EntryHashB64): Promise<ActionHash> {
    return this.call('hide_space', spaceEh64);
  }

  async unhideSpace(spaceEh64: EntryHashB64): Promise<void> {
    return this.call('unhide_space', spaceEh64);
  }

  async getHiddenSpaces(): Promise<EntryHashB64[]> {
    return this.call('get_hidden_spaces', null);
  }


  async getSession(input: GetSessionInput): Promise<EntryHashB64 | null> {
    return this.call('get_session', input);
  }

  async getSessionFromEh(sessionEh: EntryHashB64): Promise<PlacementSession | null> {
    return this.call('get_session_from_eh', sessionEh);
  }

  async getSpaceSessions(spaceEh: EntryHashB64): Promise<EntryHashB64[]> {
    return this.call('get_space_sessions', spaceEh);
  }

  async createSessions(input: SpaceSessionsInput): Promise<EntryHashB64[]> {
    return this.call('create_sessions', input);
  }

  async createNextSession(input: CreateNextSessionInput): Promise<[EntryHashB64, number]> {
    return this.call('create_next_session', input);
  }


  async notifyPeers(input: NotifyInput): Promise<void> {
    return this.call('notify_peers', input);
  }
}
