import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { WhereService, locationFromHere, hereFromLocation } from './where.service';
import {
  Dictionary,
  Space,
  SpaceEntry,
  LocationInfo,
  Location,
  Coord,
  TemplateEntry,
} from './types';
import {
  ProfilesStore,
} from "@holochain-open-dev/profiles";

export class WhereStore {
  /** Private */
  private service : WhereService
  private profiles: ProfilesStore

  /** TemplateEh -> Template */
  private templatesStore: Writable<Dictionary<TemplateEntry>> = writable({});
  /** SpaceEh -> Space */
  private spacesStore: Writable<Dictionary<Space>> = writable({});
  /** SpaceEh -> zoomPct */
  private zoomsStore: Writable<Dictionary<number>> = writable({});

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public templates: Readable<Dictionary<TemplateEntry>> = derived(this.templatesStore, i => i)
  public spaces: Readable<Dictionary<Space>> = derived(this.spacesStore, i => i)
  public zooms: Readable<Dictionary<number>> = derived(this.zoomsStore, i => i)

  constructor(
    protected cellClient: CellClient,
  profilesStore: ProfilesStore,
  zomeName = 'hc_zome_where'
  ) {
    this.myAgentPubKey = serializeHash(cellClient.cellId[1]);
    this.profiles = profilesStore;
    this.service = new WhereService(cellClient, zomeName);

    cellClient.addSignalHandler( signal => {
    console.log("SIGNAL",signal)
    const payload = signal.data.payload
    switch(payload.message.type) {
      case "NewTemplate":
        if (!get(this.templates)[payload.spaceHash]) {
          this.templatesStore.update(templates => {
            templates[payload.spaceHash] = payload.message.content
            return templates
          })
        }
        break;
      case "NewSpace":
        if (!get(this.spaces)[payload.spaceHash]) {
          this.updateSpaceFromEntry(payload.spaceHash, payload.message.content)
        }
        break;
      case "NewHere":
        if (get(this.spaces)[payload.spaceHash]) {
          this.spacesStore.update(spaces => {
            let locations = spaces[payload.spaceHash].locations
            const w : LocationInfo = locationFromHere(payload.message.content)
            const idx = locations.findIndex((locationInfo) => locationInfo.hash == payload.message.hash)
            if (idx > -1) {
              locations[idx] = w
            } else {
              locations.push(w)
            }
            return spaces
          })
        }
        break;
      case "DeleteHere":
        if (get(this.spaces)[payload.spaceHash]) {
          this.spacesStore.update(spaces => {
            let locations = spaces[payload.spaceHash].locations
            const idx = locations.findIndex((locationInfo) => locationInfo.hash == payload.message.content)
            if (idx > -1) {
              locations.splice(idx, 1);
            }
            return spaces
          })
        }
        break;
    }
  })

  }

  private others(): Array<AgentPubKeyB64> {
    return Object.keys(get(this.profiles.knownProfiles)).filter((key)=> key != this.myAgentPubKey)
  }

  private async updateSpaceFromEntry(hash: EntryHashB64, entry: SpaceEntry): Promise<void>   {
    //console.log("updateSpaceFromEntry: " + hash)
    const space : Space = await this.service.spaceFromEntry(hash, entry)
    this.spacesStore.update(spaces => {
      spaces[hash] = space
      return spaces
    })
    if (!get(this.zoomsStore)[hash]) {
      this.zoomsStore.update(zooms => {
        zooms[hash] = 1.0
        return zooms
      })
    }
  }

  async updateTemplates() : Promise<Dictionary<TemplateEntry>> {
    // const templates = await service.getTemplates();
    // for (const s of templates) {
    //   await updateSpaceFromEntry(s.hash, s.content)
    // }
    return get(this.templatesStore)
  }

  async addTemplate(template: TemplateEntry) : Promise<EntryHashB64> {
    const eh64: EntryHashB64 = await this.service.createTemplate(template)
    this.templatesStore.update(templates => {
      templates[eh64] = template
      return templates
    })
    this.service.notify(
      {spaceHash: eh64, message: {type:"NewTemplate", content:template}}
      , this.others());
    return eh64
  }

  async updateSpaces() : Promise<Dictionary<Space>> {
    const _templates = await this.service.getTemplates();
    const spaces = await this.service.getSpaces();
    //console.log({spaces})
    for (const s of spaces) {
      await this.updateSpaceFromEntry(s.hash, s.content)
    }
    return get(this.spacesStore)
  }

  async addSpace(space: Space) : Promise<EntryHashB64> {
    const s: SpaceEntry = {
      name: space.name,
      origin: space.origin,
      surface: JSON.stringify(space.surface),
      meta: space.meta,
    };
    const spaceEh: EntryHashB64 = await this.service.createSpace(s)
    for (const locInfo of space.locations) {
      await this.service.addLocation(locInfo.location, spaceEh)
    }
    this.spacesStore.update(spaces => {
      spaces[spaceEh] = space
      return spaces
    })
    this.zoomsStore.update(zooms => {
      zooms[spaceEh] = 1
      return zooms
    })
    this.service.notify({spaceHash:spaceEh, message: {type:"NewSpace", content:s}}, this.others());
    return spaceEh
  }

  async addLocation(spaceEh: string, location: Location) : Promise<void> {
    const entry = hereFromLocation(location)
    const hash = await this.service.addLocation(location, spaceEh)
    const locInfo: LocationInfo = {
      location,
      hash,
      authorPubKey: this.myAgentPubKey
    }
    this.spacesStore.update(spaces => {
      spaces[spaceEh].locations.push(locInfo)
      return spaces
    })
    this.service.notify({
      spaceHash: spaceEh,
      message: {
        type: "NewHere",
        content: {entry ,hash, author: this.myAgentPubKey}
      }}
      , this.others());
  }

  async updateLocation(spaceHash: string, idx: number, c: Coord, tag?: string) {
    const space = get(this.spacesStore)[spaceHash]
    const locInfo = space.locations[idx]
    locInfo.location.coord = c
    if (tag != null) {
      locInfo.location.meta.tag = tag
    }
    const hash: HeaderHashB64 = await this.service.addLocation(locInfo.location, spaceHash)
    await this.service.deleteLocation(locInfo.hash)
    const oldHash = locInfo.hash
    locInfo.hash = hash
    this.spacesStore.update(spaces => {
      spaces[spaceHash].locations[idx] = locInfo
      return spaces
    })
    const entry = hereFromLocation(locInfo.location)
    await this.service.notify({spaceHash, message: {type: "DeleteHere", content:oldHash}}, this.others());
    await this.service.notify({spaceHash, message: {type: "NewHere", content: {entry, hash, author: this.myAgentPubKey}}}, this.others());
  }

    getAgentIdx (space: string, agent: string) : number {
    return get(this.spacesStore)[space].locations.findIndex((locInfo) => locInfo.location.meta.name == agent)
  }

  template(templateEh64: EntryHashB64): TemplateEntry {
      return get(this.templatesStore)[templateEh64];
  }

  space(spaceEh: EntryHashB64): Space {
    return get(this.spacesStore)[spaceEh];
  }

  zoom(spaceEh: EntryHashB64) : number {
    return get(this.zoomsStore)[spaceEh]
  }

  updateZoom(spaceEh: EntryHashB64, delta: number) : void {
    this.zoomsStore.update(zooms => {
      if (zooms[spaceEh] + delta < 0) {
        zooms[spaceEh] = 0
      } else {
        zooms[spaceEh] += delta;
      }
      return zooms
    })
  }
}
