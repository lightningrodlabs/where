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
import {DnaClient, ZomeViewModel} from "@ddd-qc/dna-client";
import {PlaysetBridge} from "./playset.bridge";
import {Inventory, PlaysetPerspective} from "./playset.perspective";


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
export class PlaysetViewModel extends ZomeViewModel<PlaysetPerspective, PlaysetBridge> {
  /** Ctor */
  constructor(protected dnaClient: DnaClient) {
    super(new PlaysetBridge(dnaClient));
  }

  /** -- ZomeViewModel -- */

  static context = createContext<PlaysetViewModel>('zome_view_model/where_playset');
  getContext(): any {return PlaysetViewModel.context}

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }

  /** */
  async probeDht() {
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
  private _spaces: Dictionary<SpaceEntry> = {};

  getSvgMarker(eh: EntryHashB64): SvgMarkerEntry | undefined {return this._svgMarkers[eh]}
  getEmojiGroup(eh: EntryHashB64): EmojiGroupEntry | undefined {return this._emojiGroups[eh]}
  getTemplate(templateEh64: EntryHashB64): TemplateEntry | undefined {return this._templates[templateEh64]}
  getSpace(eh: EntryHashB64): SpaceEntry | undefined {return this._spaces[eh]}


  /** -- Methods -- */

  /** Probe */

  async probeInventory(): Promise<GetInventoryOutput> {
    return this._bridge.getInventory();
  }

  async probeTemplates() : Promise<Dictionary<TemplateEntry>> {
    const templates = await this._bridge.getTemplates();
    for (const t of templates) {
        this._templates[t.hash] = t.content
    }
    this.notify();
    return this._templates;
  }

  async probeSvgMarkers() : Promise<Dictionary<SvgMarkerEntry>> {
    const markers = await this._bridge.getSvgMarkers();
    for (const e of markers) {
      this._svgMarkers[e.hash] = e.content
    }
    this.notify();
    return this._svgMarkers
  }

  async probeEmojiGroups() : Promise<Dictionary<EmojiGroupEntry>> {
    const groups = await this._bridge.getEmojiGroups();
    for (const e of groups) {
      this._emojiGroups[e.hash] = e.content
    }
    this.notify();
    return this._emojiGroups
  }

  async probeSpaces() : Promise<Dictionary<SpaceEntry>> {
    const spaces = await this._bridge.getSpaces();
    for (const e of spaces) {
      this._spaces[e.hash] = e.content
    }
    this.notify();
    return this._spaces
  }


  /** Publish */

  async publishTemplate(template: TemplateEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._bridge.createTemplate(template)
    this._templates[eh] = template
    this.notify();
    return eh
  }

  async publishEmojiGroup(emojiGroup: EmojiGroupEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._bridge.createEmojiGroup(emojiGroup)
    this._emojiGroups[eh] = emojiGroup
    this.notify();
    return eh
  }

  async publishSvgMarker(svgMarker: SvgMarkerEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._bridge.createSvgMarker(svgMarker)
    this._svgMarkers[eh] = svgMarker
    this.notify();
    return eh
  }

  async publishSpace(space: SpaceEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._bridge.createSpace(space)
    this._spaces[eh] = space
    this.notify();
    return eh
  }


  /** */
  async exportPiece(pieceEh: EntryHashB64, pieceType: PieceType, cellId: CellId) : Promise<void> {
    if (pieceType == PieceType.Space) {
      return this._bridge.exportSpace(pieceEh, cellId);
    }
    return this._bridge.exportPiece(pieceEh, pieceType, cellId);
  }

}
