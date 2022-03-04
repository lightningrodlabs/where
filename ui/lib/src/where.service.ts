import { CellClient } from '@holochain-open-dev/cell-client';
import { serializeHash, EntryHashB64, HeaderHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';

import {
  SpaceEntry,
  Play,
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
  Space,
} from './types';

export class WhereService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'hc_zome_where'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  /** Svg Markers */

  async createSvgMarker(entry: SvgMarkerEntry): Promise<EntryHashB64> {
    return this.callZome('create_svg_marker', entry);
  }

  async getSvgMarkers(): Promise<Array<HoloHashed<SvgMarkerEntry>>> {
    return this.callZome('get_svg_markers', null);
  }

  /** EmojiGroup */

  async createEmojiGroup(template: EmojiGroupEntry): Promise<EntryHashB64> {
    return this.callZome('create_emoji_group', template);
  }

  async getEmojiGroups(): Promise<Array<HoloHashed<EmojiGroupEntry>>> {
    return this.callZome('get_all_emoji_groups', null);
  }

  /** Template */

  async getTemplates(): Promise<Array<HoloHashed<TemplateEntry>>> {
    return this.callZome('get_templates', null);
  }

  async createTemplate(template: TemplateEntry): Promise<EntryHashB64> {
    return this.callZome('create_template', template);
  }

  /** Space */

  async createSpace(space: SpaceEntry): Promise<EntryHashB64> {
    return this.callZome('create_space', space);
  }

  async createSpaceWithSessions(space: SpaceEntry, sessionNames: string[]): Promise<EntryHashB64> {
    return this.callZome('create_space_with_sessions', {sessionNames, space});
  }

  async getSpace(spaceEh: EntryHashB64): Promise<SpaceEntry> {
    return this.callZome('get_space', spaceEh);
  }

  async hideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.callZome('hide_space', spaceEh);
  }

  async unhideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.callZome('unhide_space', spaceEh);
  }

  /** Space·s */

  async getSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    return this.callZome('get_spaces', null);
  }

  async getVisibleSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    return this.callZome('get_visible_spaces', null);
  }

  async getHiddenSpaceList(): Promise<Array<EntryHashB64>> {
    return this.callZome('get_hidden_spaces', null);
  }

  async isSpaceVisible(spaceEh: EntryHashB64): Promise<boolean> {
    const visibles: Array<HoloHashed<SpaceEntry>> = await this.callZome('get_visible_spaces', null);
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
    return this.callZome('get_session_from_eh', sessionEh);
  }

  async getSessionHash(spaceEh: EntryHashB64, index: number): Promise<EntryHashB64 | null> {
    return this.callZome('get_session', {spaceEh, index});
  }

  async getAllSessions(spaceEh: EntryHashB64): Promise<EntryHashB64[]> {
    return this.callZome('get_all_sessions', spaceEh);
  }

  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<EntryHashB64> {
    return this.callZome('create_next_session', {name, spaceEh});
  }


  /** Location */

  async addLocation(location: Location, spaceEh: EntryHashB64, sessionIndex: number): Promise<HeaderHashB64> {
    const entry = this.hereFromLocation(location);
    const input = {spaceEh, sessionIndex, value: entry.value, meta: entry.meta}
    return this.callZome('add_here', input);
  }

  async updateLocation(hereHh: HeaderHashB64, location: Location, spaceEh: EntryHashB64, sessionIndex: number): Promise<HeaderHashB64> {
    const entry = this.hereFromLocation(location);
    const input = {oldHereHh: hereHh, newHere: {spaceEh, sessionIndex, value: entry.value, meta: entry.meta}}
    return this.callZome('update_here', input);
  }

  async deleteLocation(hereHh: HeaderHashB64): Promise<EntryHashB64> {
    return this.callZome('delete_here', hereHh);
  }

  async getLocations(sessionEh: EntryHashB64): Promise<Array<LocationInfo>> {
    const hereInfos =  await this.callZome('get_heres', sessionEh);
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
    return this.callZome('notify', {signal, folks});
  }

  private callZome(fn_name: string, payload: any): Promise<any> {
    //console.debug("callZome: " + fn_name)
    //console.debug({payload})
    const result = this.cellClient.callZome(this.zomeName, fn_name, payload);
    //console.debug("callZome: " + fn_name + "() result")
    //console.debug({result})
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
      meta: entry.meta ? this.metaFromEntry(entry.meta) : defaultPlayMeta(),
    }
  }

  spaceIntoEntry(space: Space): SpaceEntry {
    return {
      name: space.name,
      origin: space.origin,
      surface: JSON.stringify(space.surface),
      meta: this.metaIntoEntry(space.meta)
    }
  }

  metaFromEntry(meta: Dictionary<string>): PlayMeta {
    let spaceMeta:any = {};
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
