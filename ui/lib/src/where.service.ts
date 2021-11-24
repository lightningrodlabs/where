import { CellClient } from '@holochain-open-dev/cell-client';
import { HoloHashed, serializeHash, EntryHashB64, HeaderHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import {
  SpaceEntry,
  Space,
  HereEntry,
  LocationInfo,
  HereInfo,
  Signal,
  TemplateEntry,
  Location,
  Dictionary, SpaceMeta, MarkerType, EmojiGroupEntry,
} from './types';


export function locationFromHere(info: HereInfo) : LocationInfo {
  return {
    location: {
      coord: JSON.parse(info.entry.value),
      meta: info.entry.meta,
    },
    hash: info.hash,
    authorPubKey: info.author,
  }
}

export function hereFromLocation(location: Location) : HereEntry {
  return {
    value: JSON.stringify(location.coord),
    meta: location.meta
  }
}



export class WhereService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'hc_zome_where'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async getTemplates(): Promise<Array<HoloHashed<TemplateEntry>>> {
    return this.callZome('get_templates', null);
  }

  async getSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    return this.callZome('get_spaces', null);
  }

  async getVisibleSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    return this.callZome('get_visible_spaces', null);
  }

  async getHiddenSpaceList(): Promise<Array<EntryHashB64>> {
    return this.callZome('get_hidden_spaces', null);
  }

  async getLocations(spaceEh: EntryHashB64): Promise<Array<LocationInfo>> {
    const hereInfos =  await this.callZome('get_heres', spaceEh);
    return hereInfos.map((info: HereInfo) => {
      return locationFromHere(info)
    });
  }

  async addLocation(location: Location, space: EntryHashB64): Promise<HeaderHashB64> {
    const entry = hereFromLocation(location);
    return this.callZome('add_here', {entry, space});
  }

  async deleteLocation(hereHh: HeaderHashB64): Promise<EntryHashB64> {
    return this.callZome('delete_here', hereHh);
  }

  async createEmojiGroup(template: EmojiGroupEntry): Promise<EntryHashB64> {
    return this.callZome('create_emoji_group', template);
  }

  async createTemplate(template: TemplateEntry): Promise<EntryHashB64> {
    return this.callZome('create_template', template);
  }

  async createSpace(space: SpaceEntry): Promise<EntryHashB64> {
    return this.callZome('create_space', space);
  }

  async hideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.callZome('hide_space', spaceEh);
  }

  async unhideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.callZome('unhide_space', spaceEh);
  }


  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }

  // -- Conversion -- //

  async spaceFromEntry(hash: EntryHashB64, entry: SpaceEntry, visible: boolean): Promise<Space> {
    return {
      name : entry.name,
      origin: entry.origin,
      meta : entry.meta? this.metaFromEntry(entry.meta) : this.defaultSpaceMeta(),
      visible,
      surface: JSON.parse(entry.surface),
      locations: await this.getLocations(hash)
    }
  }

  spaceIntoEntry(space: Space): SpaceEntry {
  let s: SpaceEntry = {
      name: space.name,
      origin: space.origin,
      surface: JSON.stringify(space.surface),
      meta: this.metaIntoEntry(space.meta),
    }
    //console.log(s)
    return s
  }

  metaFromEntry(meta: Dictionary<string>): SpaceMeta {
    let spaceMeta:any = {};
    try {
      for (const [key, value] of Object.entries(meta)) {
        Object.assign(spaceMeta, {[key]: JSON.parse(value, this.reviver)})
      }
    } catch (e) {
      console.error("Failed parsing meta filed into SpaceMeta")
      console.error(e)
    }
    //console.log({spaceMeta})
    return spaceMeta as SpaceMeta;
  }

  metaIntoEntry(spaceMeta: SpaceMeta): Dictionary<string> {
    let dic: Dictionary<string> = {};
    for (const [key, value] of Object.entries(spaceMeta)) {
      dic[key] = JSON.stringify(value, this.replacer)
    }
    //console.log({dic})
    return dic
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

  defaultSpaceMeta(): SpaceMeta {
    return  {
      subMap: new Map(),
      markerType: MarkerType.Avatar,
      multi: false,
      canTag: false,
      tagVisible: false,
      ui: [],
      singleEmoji: "",
      emojiGroup: null,
    } as SpaceMeta
  }
}
