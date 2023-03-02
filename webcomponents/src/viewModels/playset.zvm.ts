import {CellId, EntryHashB64} from "@holochain/client";
import {EmojiGroup, GetInventoryOutput, PlaysetEntryType, Space, SvgMarker, Template
} from "../bindings/playset.types";
import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {PlaysetProxy} from "../bindings/playset.proxy";
import {materializeSpace, dematerializeSpace, Inventory, PlaysetPerspective, SpaceMat} from "./playset.perspective";


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
export class PlaysetZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = PlaysetProxy;

  /** -- ZomeViewModel -- */

  get zomeProxy(): PlaysetProxy {return this._zomeProxy as PlaysetProxy;}

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  async initializePerspectiveOnline(): Promise<void> {
    await this.ProbePlaysets();
  }

  async ProbePlaysets(): Promise<void> {
    await this.probeSvgMarkers();
    await this.probeEmojiGroups();
    await this.probeTemplates();
    await this.probeSpaces();
  }


  /** */
  probeAllInner() {
    this.ProbePlaysets();
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

  private _svgMarkers: Record<string, SvgMarker> = {};
  private _emojiGroups: Record<string, EmojiGroup> = {};
  private _templates: Record<string, Template> = {};
  private _spaces: Record<string, SpaceMat> = {};

  getSvgMarker(eh: EntryHashB64): SvgMarker | undefined {return this._svgMarkers[eh]}
  getEmojiGroup(eh: EntryHashB64): EmojiGroup | undefined {return this._emojiGroups[eh]}
  getTemplate(templateEh64: EntryHashB64): Template | undefined {return this._templates[templateEh64]}
  getSpace(eh: EntryHashB64): SpaceMat | undefined {return this._spaces[eh]}


  /** -- Methods -- */

  /** Probe */

  async probeInventory(): Promise<GetInventoryOutput> {
    return this.zomeProxy.getInventory();
  }

  async probeTemplates() : Promise<Record<string, Template>> {
    const templates = await this.zomeProxy.getTemplates();
    for (const t of templates) {
        this._templates[t.hash] = t.content
    }
    this.notifySubscribers();
    return this._templates;
  }

  async probeSvgMarkers() : Promise<Record<string, SvgMarker>> {
    const markers = await this.zomeProxy.getSvgMarkers();
    for (const e of markers) {
      this._svgMarkers[e.hash] = e.content
    }
    this.notifySubscribers();
    return this._svgMarkers
  }

  async probeEmojiGroups() : Promise<Record<string, EmojiGroup>> {
    const groups = await this.zomeProxy.getAllEmojiGroups();
    for (const e of groups) {
      this._emojiGroups[e.hash] = e.content
    }
    this.notifySubscribers();
    return this._emojiGroups
  }

  async probeSpaces() : Promise<Record<string, SpaceMat>> {
    const spaces = await this.zomeProxy.getSpaces();
    for (const e of spaces) {
      this._spaces[e.hash] = materializeSpace(e.content)
    }
    this.notifySubscribers();
    return this._spaces
  }

  /** Fetch */

  async fetchSvgMarker(eh: EntryHashB64): Promise<SvgMarker> {
    const svgMarkerEntry = await this.zomeProxy.getSvgMarker(eh);
    if (svgMarkerEntry === null) {
      Promise.reject("SvgMarker not found at " + eh)
    }
    this._svgMarkers[eh] = svgMarkerEntry!;
    this.notifySubscribers();
    return this._svgMarkers[eh];
  }

  async fetchEmojiGroup(eh: EntryHashB64): Promise<EmojiGroup> {
    const entry = await this.zomeProxy.getEmojiGroup(eh);
    if (entry === null) {
      Promise.reject("EmojiGroup not found at " + eh)
    }
    this._emojiGroups[eh] = entry!;
    this.notifySubscribers();
    return this._emojiGroups[eh];
  }

  async fetchTemplate(eh: EntryHashB64): Promise<Template> {
    const entry = await this.zomeProxy.getTemplate(eh);
    if (entry === null) {
      Promise.reject("Template not found at " + eh)
    }
    this._templates[eh] = entry!;
    this.notifySubscribers();
    return this._templates[eh];
  }

  async fetchSpace(eh: EntryHashB64): Promise<SpaceMat> {
    const entry = await this.zomeProxy.getSpace(eh);
    if (entry === null) {
      Promise.reject("Space not found at " + eh)
    }
    this._spaces[eh] = materializeSpace(entry!);
    this.notifySubscribers();
    return this._spaces[eh];
  }


  /** Publish */

  async publishTemplateEntry(template: Template) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.zomeProxy.createTemplate(template)
    this._templates[eh] = template
    this.notifySubscribers();
    return eh
  }

  async publishEmojiGroupEntry(emojiGroup: EmojiGroup) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.zomeProxy.createEmojiGroup(emojiGroup)
    this._emojiGroups[eh] = emojiGroup
    this.notifySubscribers();
    return eh
  }

  async publishSvgMarkerEntry(svgMarker: SvgMarker) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.zomeProxy.createSvgMarker(svgMarker)
    this._svgMarkers[eh] = svgMarker
    this.notifySubscribers();
    return eh
  }


  /** */
  async publishSpace(space: SpaceMat): Promise<EntryHashB64> {
    const entry = dematerializeSpace(space);
    const spaceEh: EntryHashB64 = await this.publishSpaceEntry(entry)
    return spaceEh;
  }


  /** */
  async publishSpaceEntry(space: Space) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.zomeProxy.createSpace(space)
    this._spaces[eh] = materializeSpace(space)
    this.notifySubscribers();
    return eh
  }


  /** */
  async exportPiece(pieceEh: EntryHashB64, pieceType: PlaysetEntryType, cellId: CellId): Promise<EntryHashB64[]> {
    if (pieceType == PlaysetEntryType.Space) {
      return this.zomeProxy.exportSpace({spaceEh: pieceEh, cellId});
    }
    this.zomeProxy.exportPiece({pieceEh, pieceTypeName: pieceType, cellId});
    return [];
  }



}
