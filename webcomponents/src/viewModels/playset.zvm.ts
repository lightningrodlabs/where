import {Dictionary, EntryHashB64} from '@holochain-open-dev/core-types';
import {CellId} from "@holochain/client";
import {createContext} from "@lit-labs/context";
import {
  EmojiGroupEntry,
  GetInventoryOutput,
  PieceType,
  SpaceEntry,
  SvgMarkerEntry,
  TemplateEntry
} from "./playset.bindings";
import {CellProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import {PlaysetProxy} from "./playset.proxy";
import {convertEntryToSpace, convertSpaceToEntry, Inventory, PlaysetPerspective, Space} from "./playset.perspective";


/** */
export function countInventory(inventory: Inventory): number {
  return inventory.templates.length
    + inventory.spaces.length
    + inventory.svgMarkers.length
    + inventory.emojiGroups.length;
}


/**
 *
 */
export class PlaysetZvm extends ZomeViewModel<PlaysetPerspective, PlaysetProxy> {
  /** Ctor */
  constructor(protected _cellProxy: CellProxy) {
    super(new PlaysetProxy(_cellProxy));
  }

  /** -- ZomeViewModel -- */

  // static context = createContext<PlaysetZvm>('zome_view_model/where_playset');
  // getContext(): any {return PlaysetZvm.context}
  getContext(): any {return createContext<PlaysetZvm>('zvm/'+ this.zomeName +'/' + this._cellProxy.dnaHash)}

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }

  /** */
  async probeAll() {
    await this.probeSvgMarkers();
    await this.probeEmojiGroups();
    await this.probeTemplates();
    await this.probeSpaces();
  }

  /** -- Perspective -- */

  /* */
  get perspective(): PlaysetPerspective {
    return {
      svgMarkers: this._svgMarkers,
      emojiGroups: this._emojiGroups,
      templates: this._templates,
      spaces: this._spaces,
    };
  }

  private _svgMarkers: Dictionary<SvgMarkerEntry> = {};
  private _emojiGroups: Dictionary<EmojiGroupEntry> = {};
  private _templates: Dictionary<TemplateEntry> = {};
  private _spaces: Dictionary<Space> = {};

  getSvgMarker(eh: EntryHashB64): SvgMarkerEntry | undefined {return this._svgMarkers[eh]}
  getEmojiGroup(eh: EntryHashB64): EmojiGroupEntry | undefined {return this._emojiGroups[eh]}
  getTemplate(templateEh64: EntryHashB64): TemplateEntry | undefined {return this._templates[templateEh64]}
  getSpace(eh: EntryHashB64): Space | undefined {return this._spaces[eh]}


  /** -- Methods -- */

  /** Probe */

  async probeInventory(): Promise<GetInventoryOutput> {
    return this._zomeProxy.getInventory();
  }

  async probeTemplates() : Promise<Dictionary<TemplateEntry>> {
    const templates = await this._zomeProxy.getTemplates();
    for (const t of templates) {
        this._templates[t.hash] = t.content
    }
    this.notifySubscribers();
    return this._templates;
  }

  async probeSvgMarkers() : Promise<Dictionary<SvgMarkerEntry>> {
    const markers = await this._zomeProxy.getSvgMarkers();
    for (const e of markers) {
      this._svgMarkers[e.hash] = e.content
    }
    this.notifySubscribers();
    return this._svgMarkers
  }

  async probeEmojiGroups() : Promise<Dictionary<EmojiGroupEntry>> {
    const groups = await this._zomeProxy.getEmojiGroups();
    for (const e of groups) {
      this._emojiGroups[e.hash] = e.content
    }
    this.notifySubscribers();
    return this._emojiGroups
  }

  async probeSpaces() : Promise<Dictionary<Space>> {
    const spaces = await this._zomeProxy.getSpaces();
    for (const e of spaces) {
      this._spaces[e.hash] = convertEntryToSpace(e.content)
    }
    this.notifySubscribers();
    return this._spaces
  }

  /** Fetch */

  async fetchSvgMarker(eh: EntryHashB64): Promise<SvgMarkerEntry> {
    const svgMarkerEntry = await this._zomeProxy.getSvgMarker(eh)
    this._svgMarkers[eh] = svgMarkerEntry;
    this.notifySubscribers();
    return svgMarkerEntry;
  }

  async fetchEmojiGroup(eh: EntryHashB64): Promise<EmojiGroupEntry> {
    const entry = await this._zomeProxy.getEmojiGroup(eh)
    this._emojiGroups[eh] = entry;
    this.notifySubscribers();
    return entry;
  }

  async fetchTemplate(eh: EntryHashB64): Promise<TemplateEntry> {
    const entry = await this._zomeProxy.getTemplate(eh)
    this._templates[eh] = entry;
    this.notifySubscribers();
    return entry;
  }

  async fetchSpace(eh: EntryHashB64): Promise<SpaceEntry> {
    const entry = await this._zomeProxy.getSpace(eh)
    this._spaces[eh] = convertEntryToSpace(entry);
    this.notifySubscribers();
    return entry;
  }

  /** Publish */

  async publishTemplateEntry(template: TemplateEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._zomeProxy.createTemplate(template)
    this._templates[eh] = template
    this.notifySubscribers();
    return eh
  }

  async publishEmojiGroupEntry(emojiGroup: EmojiGroupEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._zomeProxy.createEmojiGroup(emojiGroup)
    this._emojiGroups[eh] = emojiGroup
    this.notifySubscribers();
    return eh
  }

  async publishSvgMarkerEntry(svgMarker: SvgMarkerEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._zomeProxy.createSvgMarker(svgMarker)
    this._svgMarkers[eh] = svgMarker
    this.notifySubscribers();
    return eh
  }


  /** */
  async publishSpace(space: Space): Promise<EntryHashB64> {
    const entry = convertSpaceToEntry(space);
    const spaceEh: EntryHashB64 = await this.publishSpaceEntry(entry)
    return spaceEh;
  }


  /** */
  async publishSpaceEntry(space: SpaceEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._zomeProxy.createSpace(space)
    this._spaces[eh] = convertEntryToSpace(space)
    this.notifySubscribers();
    return eh
  }


  /** */
  async exportPiece(pieceEh: EntryHashB64, pieceType: PieceType, cellId: CellId) : Promise<void> {
    if (pieceType == PieceType.Space) {
      return this._zomeProxy.exportSpace(pieceEh, cellId);
    }
    return this._zomeProxy.exportPiece(pieceEh, pieceType, cellId);
  }



}
