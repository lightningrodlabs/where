import {ZomeProxy} from "@ddd-qc/dna-client";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {CellId} from "@holochain/client";
import {EmojiGroupEntry, GetInventoryOutput, SpaceEntry, SvgMarkerEntry, TemplateEntry} from "./playset.bindings";
import {HoloHashedB64} from "../utils";

/**
 *
 */
export class PlaysetProxy extends ZomeProxy {
  zomeName = "where_playset"

  /** Export  */
  async exportPiece(pieceEh: EntryHashB64, pieceTypeName: string, cellId: CellId) : Promise<void> {
    const payload = {cellId, pieceEh, pieceTypeName};
    console.log({payload})
    return this.call('export_piece', payload, null);
  }

  async exportSpace(spaceEh: EntryHashB64, cellId: CellId) : Promise<void> {
    return this.call('export_space', {cellId, spaceEh}, null);
  }


  async getInventory(): Promise<GetInventoryOutput> {
    return this.call('get_inventory', null, null);
  }

  /** Svg Markers */

  async getSvgMarker(eh: EntryHashB64): Promise<SvgMarkerEntry> {
    return this.call('get_svg_marker', eh, null);
  }

  async createSvgMarker(entry: SvgMarkerEntry): Promise<EntryHashB64> {
    return this.call('create_svg_marker', entry, null);
  }

  async getSvgMarkers(): Promise<Array<HoloHashedB64<SvgMarkerEntry>>> {
    return this.call('get_svg_markers', null, null);
  }

  /** EmojiGroup */

  async getEmojiGroup(eh: EntryHashB64): Promise<EmojiGroupEntry> {
    return this.call('get_emoji_group', eh, null);
  }

  async createEmojiGroup(template: EmojiGroupEntry): Promise<EntryHashB64> {
    return this.call('create_emoji_group', template, null);
  }

  async getEmojiGroups(): Promise<Array<HoloHashedB64<EmojiGroupEntry>>> {
    return this.call('get_all_emoji_groups', null, null);
  }

  /** Template */

  async getTemplate(templateeEh: EntryHashB64): Promise<TemplateEntry> {
    return this.call('get_template', templateeEh, null);
  }

  async getTemplates(): Promise<Array<HoloHashedB64<TemplateEntry>>> {
    return this.call('get_templates', null, null);
  }

  async createTemplate(template: TemplateEntry): Promise<EntryHashB64> {
    return this.call('create_template', template, null);
  }

  /** Space */

  async createSpace(space: SpaceEntry): Promise<EntryHashB64> {
    return this.call('create_space', space, null);
  }

  async getSpace(spaceEh: EntryHashB64): Promise<SpaceEntry> {
    return this.call('get_space', spaceEh, null);
  }


  async getSpaces(): Promise<Array<HoloHashedB64<SpaceEntry>>> {
    return this.call('get_spaces', null, null);
  }
}
