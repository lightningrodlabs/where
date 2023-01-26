/* This file is generated by zits. Do not edit manually */

import {PlaysetEntry, MarkerPiece, ExportPieceInput, ExportSpaceInput, GetInventoryOutput, ImportPieceInput, EmojiGroupOutput, SpaceOutput, SvgMarkerOutput, TemplateOutput, EmojiGroup, Space, SvgMarker, Template, } from './playset.types';
import {
/** types.ts */
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
Timestamp,
Duration,
HoloHashed,
NetworkInfo,
FetchQueueInfo,
/** hdk/action.ts */
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
/** hdk/capabilities.ts */
CapSecret,
CapClaim,
ZomeCallCapGrant,
CapAccess,
CapGrant,
GrantedFunctionsType,
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
/** api/admin/types.ts */
InstalledAppInfoStatus,
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
import {playsetFunctionNames} from './playset.fn';

/**
 *
 */
export class PlaysetProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "zPlayset"
  static readonly FN_NAMES = playsetFunctionNames
 
  async exportPiece(input: ExportPieceInput): Promise<void> {
    return this.call('export_piece', input);
  }

  async exportSpace(input: ExportSpaceInput): Promise<void> {
    return this.call('export_space', input);
  }

  async getInventory(): Promise<GetInventoryOutput> {
    return this.call('get_inventory', null);
  }

  async importPiece(input: ImportPieceInput): Promise<void> {
    return this.call('import_piece', input);
  }

  async createEmojiGroup(input: EmojiGroup): Promise<EntryHashB64> {
    return this.call('create_emoji_group', input);
  }

  async getEmojiGroup(input: EntryHashB64): Promise<EmojiGroup | null> {
    return this.call('get_emoji_group', input);
  }

  async getAllEmojiGroups(): Promise<EmojiGroupOutput[]> {
    return this.call('get_all_emoji_groups', null);
  }

  async createSpace(input: Space): Promise<EntryHashB64> {
    return this.call('create_space', input);
  }

  async getSpace(spaceEh: EntryHashB64): Promise<Space | null> {
    return this.call('get_space', spaceEh);
  }

  async getSpaces(): Promise<SpaceOutput[]> {
    return this.call('get_spaces', null);
  }

  async createSvgMarker(input: SvgMarker): Promise<EntryHashB64> {
    return this.call('create_svg_marker', input);
  }

  async getSvgMarker(input: EntryHashB64): Promise<SvgMarker | null> {
    return this.call('get_svg_marker', input);
  }

  async getSvgMarkers(): Promise<SvgMarkerOutput[]> {
    return this.call('get_svg_markers', null);
  }

  async createTemplate(input: Template): Promise<EntryHashB64> {
    return this.call('create_template', input);
  }

  async getTemplate(input: EntryHashB64): Promise<Template | null> {
    return this.call('get_template', input);
  }

  async getTemplates(): Promise<TemplateOutput[]> {
    return this.call('get_templates', null);
  }
}
