import {ZomeProxy} from "@ddd-qc/lit-happ";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {CellId} from "@holochain/client";
import {EmojiGroup, GetInventoryOutput, Space, SvgMarker, Template} from "./playset.bindings";
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

  async getSvgMarker(eh: EntryHashB64): Promise<SvgMarker> {
    return this.call('get_svg_marker', eh);
  }

  async createSvgMarker(entry: SvgMarker): Promise<EntryHashB64> {
    return this.call('create_svg_marker', entry);
  }

  async getSvgMarkers(): Promise<Array<HoloHashedB64<SvgMarker>>> {
    return this.call('get_svg_markers', null);
  }

  /** EmojiGroup */

  async getEmojiGroup(eh: EntryHashB64): Promise<EmojiGroup> {
    return this.call('get_emoji_group', eh);
  }

  async createEmojiGroup(template: EmojiGroup): Promise<EntryHashB64> {
    return this.call('create_emoji_group', template);
  }

  async getEmojiGroups(): Promise<Array<HoloHashedB64<EmojiGroup>>> {
    return this.call('get_all_emoji_groups', null);
  }

  /** Template */

  async getTemplate(templateeEh: EntryHashB64): Promise<Template> {
    return this.call('get_template', templateeEh);
  }

  async getTemplates(): Promise<Array<HoloHashedB64<Template>>> {
    return this.call('get_templates', null);
  }

  async createTemplate(template: Template): Promise<EntryHashB64> {
    return this.call('create_template', template);
  }

  /** Space */

  async createSpace(space: Space): Promise<EntryHashB64> {
    return this.call('create_space', space);
  }

  async getSpace(spaceEh: EntryHashB64): Promise<Space> {
    return this.call('get_space', spaceEh);
  }


  async getSpaces(): Promise<Array<HoloHashedB64<Space>>> {
    return this.call('get_spaces', null);
  }
}
