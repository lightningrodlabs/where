import { CellClient } from '@holochain-open-dev/cell-client';
import { HoloHashed, serializeHash, EntryHashB64, HeaderHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import {SpaceEntry, Space, HereEntry, LocationInfo, HereInfo, Signal, TemplateEntry, Location} from './types';


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

  async spaceFromEntry(hash: EntryHashB64, entry: SpaceEntry, visible: boolean): Promise<Space> {
    return {
      name : entry.name,
      origin: entry.origin,
      meta : entry.meta,
      visible,
      surface: JSON.parse(entry.surface),
      locations: await this.getLocations(hash)
    }
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
