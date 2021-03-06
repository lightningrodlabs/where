import {BaseClient, CellClient} from '@holochain-open-dev/cell-client';
import { serializeHash, EntryHashB64, HeaderHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';

import {
  SpaceEntry,
  HoloHashed,
  HereEntry,
  LocationInfo,
  HereInfo,
  Signal,
  TemplateEntry,
  Location,
  Dictionary,
  PlayMeta,
  EmojiGroupEntry,
  SvgMarkerEntry,
  defaultPlayMeta,
  PlacementSession,
  PlacementSessionEntry,
  Space, PlaysetEntry, Inventory,
} from './types';
import {CellId} from "@holochain/client/lib/types/common";


export class WhereService {
  constructor(
    public hcClient: BaseClient,
    protected roleId: string,
  ) {
    let maybe_cell = hcClient.cellDataByRoleId(roleId);
    if (!maybe_cell) {
      throw new Error("Cell not found for role: " + roleId);
    }
    this.cellClient = hcClient.forCell(maybe_cell)
  }

  /** Fields */

  cellClient: CellClient


  /** Methods */

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async getInventory(roleId?: string): Promise<Inventory> {
    if (roleId) {
      let maybe_cell = this.hcClient.cellDataByRoleId(roleId);
      if (!maybe_cell) {
        return Promise.reject("Cell not found for role: " + roleId);
      }
      const cellClient = this.hcClient.forCell(maybe_cell)
      return cellClient.callZome(
        "where_playset",
        'get_inventory',
        null,
        15000
      );
    } else {
      return this.callPlaysetZome('get_inventory', null);
    }
  }

  /** Playsets */

  async getPlayset(eh: EntryHashB64): Promise<PlaysetEntry> {
    return this.callLudothequeZome('get_playset', eh);
  }

  async createPlayset(entry: PlaysetEntry): Promise<EntryHashB64> {
    return this.callLudothequeZome('create_playset', entry);
  }

  async getPlaysets(): Promise<Array<HoloHashed<PlaysetEntry>>> {
    return this.callLudothequeZome('get_all_playsets', null);
  }

  async exportPlayset(playsetEh: EntryHashB64, cellId: CellId) : Promise<void> {
    return this.callLudothequeZome('export_playset', {playsetEh, cellId});
  }

  async exportPiece(pieceEh: EntryHashB64, pieceTypeName: string, cellId: CellId) : Promise<void> {
    const payload = {cellId, pieceEh, pieceTypeName};
    console.log({payload})
    return this.callPlaysetZome('export_piece', payload);
  }

  async exportSpace(spaceEh: EntryHashB64, cellId: CellId) : Promise<void> {
    return this.callPlaysetZome('export_space', {cellId, spaceEh});
  }

  /** Svg Markers */

  async getSvgMarker(eh: EntryHashB64): Promise<SvgMarkerEntry> {
    return this.callPlaysetZome('get_svg_marker', eh);
  }

  async createSvgMarker(entry: SvgMarkerEntry): Promise<EntryHashB64> {
    return this.callPlaysetZome('create_svg_marker', entry);
  }

  async getSvgMarkers(): Promise<Array<HoloHashed<SvgMarkerEntry>>> {
    return this.callPlaysetZome('get_svg_markers', null);
  }

  /** EmojiGroup */

  async getEmojiGroup(eh: EntryHashB64): Promise<EmojiGroupEntry> {
    return this.callPlaysetZome('get_emoji_group', eh);
  }

  async createEmojiGroup(template: EmojiGroupEntry): Promise<EntryHashB64> {
    return this.callPlaysetZome('create_emoji_group', template);
  }

  async getEmojiGroups(): Promise<Array<HoloHashed<EmojiGroupEntry>>> {
    return this.callPlaysetZome('get_all_emoji_groups', null);
  }

  /** Template */

  async getTemplate(templateeEh: EntryHashB64): Promise<TemplateEntry> {
    return this.callPlaysetZome('get_template', templateeEh);
  }

  async getTemplates(): Promise<Array<HoloHashed<TemplateEntry>>> {
    return this.callPlaysetZome('get_templates', null);
  }

  async createTemplate(template: TemplateEntry): Promise<EntryHashB64> {
    return this.callPlaysetZome('create_template', template);
  }

  /** Space */

  async createSpace(space: SpaceEntry): Promise<EntryHashB64> {
    return this.callPlaysetZome('create_space', space);
  }

  async getSpace(spaceEh: EntryHashB64): Promise<SpaceEntry> {
    return this.callPlaysetZome('get_space', spaceEh);
  }

  async createSpaceWithSessions(space: SpaceEntry, sessionNames: string[]): Promise<EntryHashB64> {
    console.log("createSpaceWithSessions(): " + sessionNames);
    console.log({space})
    let spaceEh = await this.createSpace(space);
    console.log("createSpaceWithSessions(): " + spaceEh);
    await this.callWhereZome('create_sessions', {sessionNames, spaceEh});
    return spaceEh;
  }

  async hideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.callWhereZome('hide_space', spaceEh);
  }

  async unhideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.callWhereZome('unhide_space', spaceEh);
  }

  /** Space??s */

  async getSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    return this.callPlaysetZome('get_spaces', null);
  }

  async getVisibleSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    let alls = await this.getSpaces();
    let hiddens = await this.getHiddenSpaceList();
    let visibles = Array();
    for (const space of alls) {
      if (!hiddens.includes(space.hash)) {
        visibles.push(space)
      }
    }
    return visibles;
  }

  async getHiddenSpaceList(): Promise<Array<EntryHashB64>> {
    return this.callWhereZome('get_hidden_spaces', null);
  }

  async isSpaceVisible(spaceEh: EntryHashB64): Promise<boolean> {
    const visibles: Array<HoloHashed<SpaceEntry>> = await this.getVisibleSpaces();
    //console.log({visibles})
    for (const visible of visibles) {
      if (visible.hash == spaceEh) {
        return true;
      }
    }
    return false;
  }

  /** Session */

  async getSession(sessionEh: EntryHashB64): Promise<PlacementSessionEntry | null> {
    return this.callWhereZome('get_session_from_eh', sessionEh);
  }

  async getSessionAddress(spaceEh: EntryHashB64, index: number): Promise<EntryHashB64 | null> {
    return this.callWhereZome('get_session', {spaceEh, index});
  }

  async getSpaceSessions(spaceEh: EntryHashB64): Promise<EntryHashB64[]> {
    return this.callWhereZome('get_space_sessions', spaceEh);
  }

  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<EntryHashB64> {
    return this.callWhereZome('create_next_session', {name, spaceEh});
  }


  /** Location */

  async addLocation(location: Location, spaceEh: EntryHashB64, sessionIndex: number): Promise<HeaderHashB64> {
    const entry = this.hereFromLocation(location);
    const input = {spaceEh, sessionIndex, value: entry.value, meta: entry.meta}
    return this.callWhereZome('add_here', input);
  }

  async updateLocation(hereHh: HeaderHashB64, location: Location, spaceEh: EntryHashB64, sessionIndex: number): Promise<HeaderHashB64> {
    const entry = this.hereFromLocation(location);
    const input = {oldHereHh: hereHh, newHere: {spaceEh, sessionIndex, value: entry.value, meta: entry.meta}}
    return this.callWhereZome('update_here', input);
  }

  async deleteLocation(hereHh: HeaderHashB64): Promise<EntryHashB64> {
    return this.callWhereZome('delete_here', hereHh);
  }

  async getLocations(sessionEh: EntryHashB64): Promise<Array<LocationInfo>> {
    const hereInfos =  await this.callWhereZome('get_heres', sessionEh);
    //console.debug({hereInfos})
    return hereInfos.map((info: HereInfo) => {
      return this.locationFromHere(info)
    });
  }

  /** Misc */

  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    //if (signal.message.type != "Ping" && signal.message.type != "Pong") {
    //  console.debug(`NOTIFY ${signal.message.type}`, signal)
    //}
    return this.callWhereZome('notify', {signal, folks});
  }


  private callWhereZome(fn_name: string, payload: any): Promise<any> {
    //console.debug("callZome: " + fn_name)
    //console.debug({payload})
    const result = this.cellClient.callZome("where", fn_name, payload);
    //console.debug("callZome: " + fn_name + "() result")
    //console.debug({result})
    return result;
  }

  private callPlaysetZome(fn_name: string, payload: any): Promise<any> {
    //console.debug("callZome: " + fn_name)
    //console.debug({payload})
    const result = this.cellClient.callZome("where_playset", fn_name, payload);
    //console.debug("callZome: " + fn_name + "() result")
    //console.debug({result})
    return result;
  }

  private callLudothequeZome(fn_name: string, payload: any): Promise<any> {
    console.debug("callZome: " + fn_name)
    console.debug({payload})
    const result = this.cellClient.callZome("where_ludotheque", fn_name, payload);
    console.debug("callZome: " + fn_name + "() result")
    console.debug({result})
    return result;
  }

  /** -- Conversions -- */

  async sessionFromEntry(sessionEh: EntryHashB64): Promise<PlacementSession> {
    const entry = await this.getSession(sessionEh);
    if (entry) {
      return {
        name: entry.name,
        index: entry.index,
        locations: await this.getLocations(sessionEh)
      }
    }
    console.error("sessionFromEntry(): Session entry not found")
    return Promise.reject();
  }

  spaceFromEntry(entry: SpaceEntry): Space {
    return {
      name: entry.name,
      origin: entry.origin,
      surface: JSON.parse(entry.surface),
      maybeMarkerPiece: entry.maybeMarkerPiece,
      meta: entry.meta ? this.metaFromEntry(entry.meta) : defaultPlayMeta(),
    }
  }

  spaceIntoEntry(space: Space): SpaceEntry {
    return {
      name: space.name,
      origin: space.origin,
      surface: JSON.stringify(space.surface),
      maybeMarkerPiece: space.maybeMarkerPiece,
      meta: this.metaIntoEntry(space.meta)
    }
  }

  metaFromEntry(meta: Dictionary<string>): PlayMeta {
    let spaceMeta: any = {};
    try {
      for (const [key, value] of Object.entries(meta)) {
        Object.assign(spaceMeta, {[key]: JSON.parse(value, this.reviver)})
      }
    } catch (e) {
      console.error("Failed parsing meta filed into PlayMeta")
      console.error(e)
    }
    //console.log({spaceMeta})
    return spaceMeta as PlayMeta;
  }

  metaIntoEntry(playMeta: PlayMeta): Dictionary<string> {
    let dic: Dictionary<string> = {};
    for (const [key, value] of Object.entries(playMeta)) {
      dic[key] = JSON.stringify(value, this.replacer)
    }
    //console.log({dic})
    return dic
  }


  locationFromHere(info: HereInfo) : LocationInfo {
    let locationMeta:any = {};
    try {
      for (const [key, value] of Object.entries(info.entry.meta)) {
        Object.assign(locationMeta, {[key]: JSON.parse(value, this.reviver)})
      }
    } catch (e) {
      console.error("Failed parsing meta filed into LocationMeta")
      console.error(e)
    }
    //
    return {
      location: {
        coord: JSON.parse(info.entry.value),
        sessionEh: info.entry.sessionEh,
        meta: locationMeta,
      },
      linkHh: info.linkHh,
      authorPubKey: info.author,
    }
  }

  hereFromLocation(location: Location) : HereEntry {
    let meta: Dictionary<string> = {};
    for (const [key, value] of Object.entries(location.meta)) {
      meta[key] = JSON.stringify(value, this.replacer)
    }
    return {
      value: JSON.stringify(location.coord),
      sessionEh: location.sessionEh,
      meta,
    }
  }

  replacer(key:any, value:any) {
    if(value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()),
      };
    } else {
      return value;
    }
  }

  reviver(key:any, value:any) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }

}
