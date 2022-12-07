import {ZomeProxy} from "@ddd-qc/lit-happ";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {CellId} from "@holochain/client";
import {EmojiGroupEntry, GetInventoryOutput, SpaceEntry, SvgMarkerEntry, TemplateEntry} from "./playset.bindings";
import {HoloHashedB64} from "../utils";

/**
 *
 */
export class PlaysetProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "zPlayset"

  /** Export  */
  async exportPiece(pieceEh: EntryHashB64, pieceTypeName: string, cellId: CellId) : Promise<void> {
    const payload = {cellId, pieceEh, pieceTypeName};
    console.log({payload})
    return this.call('export_piece', payload);
  }

  async exportSpace(spaceEh: EntryHashB64, cellId: CellId) : Promise<void> {
    return this.call('export_space', {cellId, spaceEh});
  }


  async getInventory(): Promise<GetInventoryOutput> {
    return this.call('get_inventory', null);
  }

  /** Svg Markers */

  async getSvgMarker(eh: EntryHashB64): Promise<SvgMarkerEntry> {
    return this.call('get_svg_marker', eh);
  }

  async createSvgMarker(entry: SvgMarkerEntry): Promise<EntryHashB64> {
    return this.call('create_svg_marker', entry);
  }

  async getSvgMarkers(): Promise<Array<HoloHashedB64<SvgMarkerEntry>>> {
    return this.call('get_svg_markers', null);
  }

  /** EmojiGroup */

  async getEmojiGroup(eh: EntryHashB64): Promise<EmojiGroupEntry> {
    return this.call('get_emoji_group', eh);
  }

  async createEmojiGroup(template: EmojiGroupEntry): Promise<EntryHashB64> {
    return this.call('create_emoji_group', template);
  }

  async getEmojiGroups(): Promise<Array<HoloHashedB64<EmojiGroupEntry>>> {
    return this.call('get_all_emoji_groups', null);
  }

  /** Template */

  async getTemplate(templateeEh: EntryHashB64): Promise<TemplateEntry> {
    return this.call('get_template', templateeEh);
  }

  async getTemplates(): Promise<Array<HoloHashedB64<TemplateEntry>>> {
    return this.call('get_templates', null);
  }

  async createTemplate(template: TemplateEntry): Promise<EntryHashB64> {
    return this.call('create_template', template);
  }

  /** Space */

  async createSpace(space: SpaceEntry): Promise<EntryHashB64> {
    return this.call('create_space', space);
  }

  async getSpace(spaceEh: EntryHashB64): Promise<SpaceEntry> {
    return this.call('get_space', spaceEh);
  }


  async getSpaces(): Promise<Array<HoloHashedB64<SpaceEntry>>> {
    return this.call('get_spaces', null);
  }
}
