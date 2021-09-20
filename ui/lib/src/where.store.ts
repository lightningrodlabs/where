import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { WhereService } from './where.service';
import { Dictionary, Space, SpaceEntry, WhereEntry, Where, Location, Coord} from './types';
import {
  ProfilesStore,
} from "@holochain-open-dev/profiles";

export class WhereStore {
  /** Private */
  private service : WhereService
  private profiles: ProfilesStore

  private spacesStore: Writable<Dictionary<Space>> = writable({});
  private zoomsStore: Writable<Dictionary<number>> = writable({});

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
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
      case "NewSpace":
        if (!get(this.spaces)[payload.spaceHash]) {
          this.updateSpaceFromEntry(payload.spaceHash, payload.message.content)
        }
        break;
      case "NewWhere":
        if (get(this.spaces)[payload.spaceHash]) {
          this.spacesStore.update(spaces => {
            let wheres = spaces[payload.spaceHash].wheres
            const w : Where = this.service.whereFromInfo(payload.message.content)
            const idx = wheres.findIndex((w) => w.hash == payload.message.hash)
            if (idx > -1) {
              wheres[idx] = w
            } else {
              wheres.push(w)
            }
            return spaces
          })
        }
        break;
      case "DeleteWhere":
        if (get(this.spaces)[payload.spaceHash]) {
          this.spacesStore.update(spaces => {
            let wheres = spaces[payload.spaceHash].wheres
            const idx = wheres.findIndex((w) => w.hash == payload.message.content)
            if (idx > -1) {
              wheres.splice(idx, 1);
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

  async updateSpaces() : Promise<Dictionary<Space>> {
    const spaces = await this.service.getSpaces();
    for (const s of spaces) {
      await this.updateSpaceFromEntry(s.hash, s.content)
    }
    return get(this.spacesStore)
  }

  async addSpace(space: Space) : Promise<EntryHashB64> {
    const s: SpaceEntry = {
      name: space.name,
      surface: JSON.stringify(space.surface),
      meta: space.meta,
    };
    const hash: EntryHashB64 = await this.service.createSpace(s)
    for (const w of space.wheres) {
      const entry : WhereEntry = {
        location: JSON.stringify(w.entry.location),
        meta: w.entry.meta
      }
      await this.service.addWhere(entry, hash)
    }
    this.spacesStore.update(spaces => {
      spaces[hash] = space
      return spaces
    })
    this.zoomsStore.update(zooms => {
      zooms[hash] = 1
      return zooms
    })
    this.service.notify({spaceHash:hash, message: {type:"NewSpace", content:s}}, this.others());
    return hash
  }

  async addWhere(spaceHash: string, where: Location) : Promise<void> {
    const entry : WhereEntry = {
      location: JSON.stringify(where.location),
      meta: where.meta
    }
    const hash = await this.service.addWhere(entry, spaceHash)
    const w:Where = {entry: {location: where.location, meta:where.meta}, hash, authorPubKey: this.myAgentPubKey}
    this.spacesStore.update(spaces => {
      spaces[spaceHash].wheres.push(w)
      return spaces
    })
    this.service.notify({spaceHash, message: {type:"NewWhere", content:{entry,hash,author: this.myAgentPubKey}}}, this.others());
  }

  async updateWhere(spaceHash: string, idx: number, c: Coord, tag?:string) {
    const space = get(this.spacesStore)[spaceHash]
    const w = space.wheres[idx]
    w.entry.location = c
    if (tag != null) {
      w.entry.meta.tag = tag
    }

    const entry : WhereEntry = {
      location: JSON.stringify(w.entry.location),
      meta: w.entry.meta
    }
    const hash: HeaderHashB64 = await this.service.addWhere(entry, spaceHash)
    await this.service.deleteWhere(w.hash)
    const oldHash = w.hash
    w.hash = hash
    this.spacesStore.update(spaces => {
      spaces[spaceHash].wheres[idx] = w
      return spaces
    })
    await this.service.notify({spaceHash, message:{type:"DeleteWhere", content:oldHash}}, this.others());
    await this.service.notify({spaceHash, message:{type:"NewWhere", content:{entry, hash, author: this.myAgentPubKey}}}, this.others());
  }

  getAgentIdx (space: string, agent: string) : number {
    return get(this.spacesStore)[space].wheres.findIndex((w) => w.entry.meta.name == agent)
  }

  space(space: string): Space {
    return get(this.spacesStore)[space];
  }

  zoom(current: string, delta: number) : void {
    this.zoomsStore.update(zooms => {
      if (zooms[current] + delta < 0) {
        zooms[current] = 0
      } else {
        zooms[current] += delta;
      }
      return zooms
    })
  }

  getZoom(current: string) : number {
    return get(this.zoomsStore)[current]
  }
}
