import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { WhereService } from './where.service';
import {Dictionary, Space, SpaceEntry, WhereEntry, Where, Location, Coord, TemplateEntry} from './types';
import {
  ProfilesStore,
} from "@holochain-open-dev/profiles";

export interface WhereStore {
  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  templates: Readable<Dictionary<TemplateEntry>>;
  spaces: Readable<Dictionary<Space>>;
  zooms: Readable<Dictionary<number>>;

  /** Actions */
  updateTemplates: () => Promise<Dictionary<TemplateEntry>>;
  addTemplate: (template: TemplateEntry) => Promise<EntryHashB64>;
  updateSpaces: () => Promise<Dictionary<Space>>;
  addSpace: (space: Space) => Promise<EntryHashB64>;
  addWhere: (spaceHash: string, where: Location) => Promise<void>;
  updateWhere: (spaceHash: string, idx: number, c: Coord, tag?:string) => Promise<void>;
  getAgentIdx: (space: string, agent: string) => number;
  template: (template:string) => TemplateEntry;
  space: (space:string) => Space;
  zoom: (current: string, delta:number) => void;
  getZoom: (current: string) => number;
}

export function createWhereStore(
  cellClient: CellClient,
  profilesStore: ProfilesStore,
  zomeName = 'hc_zome_where'
): WhereStore {
  const myAgentPubKey = serializeHash(cellClient.cellId[1]);
  const service = new WhereService(cellClient, zomeName);
  const profiles = profilesStore;

  const templatesStore: Writable<Dictionary<TemplateEntry>> = writable({});
  const spacesStore: Writable<Dictionary<Space>> = writable({});
  const zoomsStore: Writable<Dictionary<number>> = writable({});

  const templates: Readable<Dictionary<TemplateEntry>> = derived(templatesStore, i => i)
  const spaces: Readable<Dictionary<Space>> = derived(spacesStore, i => i)
  const zooms: Readable<Dictionary<number>> = derived(zoomsStore, i => i)

  const others = (): Array<AgentPubKeyB64> => {
    return Object.keys(get(profiles.knownProfiles)).filter((key)=> key != myAgentPubKey)
  }


  const updateSpaceFromEntry = async (hash: EntryHashB64, entry: SpaceEntry) => {
    const space : Space = await service.spaceFromEntry(hash, entry)
    spacesStore.update(spaces => {
      spaces[hash] = space
      return spaces
    })
    if (!get(zoomsStore)[hash]) {
      zoomsStore.update(zooms => {
        zooms[hash] = 1.0
        return zooms
      })
    }
  }

  service.cellClient.addSignalHandler( signal => {
    console.log("SIGNAL",signal)
    const payload = signal.data.payload
    switch(payload.message.type) {
      case "NewSpace":
        if (!get(spaces)[payload.spaceHash]) {
          updateSpaceFromEntry(payload.spaceHash, payload.message.content)
        }
        break;
      case "NewWhere":
        if (get(spaces)[payload.spaceHash]) {
          spacesStore.update(spaces => {
            let wheres = spaces[payload.spaceHash].wheres
            const w : Where = service.whereFromInfo(payload.message.content)
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
        if (get(spaces)[payload.spaceHash]) {
          spacesStore.update(spaces => {
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
  return {
    myAgentPubKey,
    templates,
    spaces,
    zooms,


    async updateTemplates() : Promise<Dictionary<TemplateEntry>> {
      // const templates = await service.getTemplates();
      // for (const s of templates) {
      //   await updateSpaceFromEntry(s.hash, s.content)
      // }
      return get(templatesStore)
    },
    async addTemplate(template: TemplateEntry) : Promise<EntryHashB64> {
      const eh64: EntryHashB64 = await service.createTemplate(template)
      templatesStore.update(templates => {
        templates[eh64] = template
        return templates
      })
      service.notify({spaceHash: eh64, message: {type:"NewTemplate", content:template}}, others());
      return eh64
    },
    async updateSpaces() : Promise<Dictionary<Space>> {
      const spaces = await service.getSpaces();
      for (const s of spaces) {
        await updateSpaceFromEntry(s.hash, s.content)
      }
      return get(spacesStore)
    },
    async addSpace(space: Space) : Promise<EntryHashB64> {
      const s: SpaceEntry = {
        name: space.name,
        origin: space.origin,
        surface: JSON.stringify(space.surface),
        meta: space.meta,
      };
      const hash: EntryHashB64 = await service.createSpace(s)
      for (const w of space.wheres) {
        const entry : WhereEntry = {
          location: JSON.stringify(w.entry.location),
          meta: w.entry.meta
        }
        await service.addWhere(entry, hash)
      }
      spacesStore.update(spaces => {
        spaces[hash] = space
        return spaces
      })
      zoomsStore.update(zooms => {
        zooms[hash] = 1
        return zooms
      })
      service.notify({spaceHash:hash, message: {type:"NewSpace", content:s}}, others());
      return hash
    },
    async addWhere(spaceHash: string, where: Location) : Promise<void> {
      const entry : WhereEntry = {
        location: JSON.stringify(where.location),
        meta: where.meta
      }
      const hash = await service.addWhere(entry, spaceHash)
      const w:Where = {entry: {location: where.location, meta:where.meta}, hash, authorPubKey: myAgentPubKey}
      spacesStore.update(spaces => {
        spaces[spaceHash].wheres.push(w)
        return spaces
      })
      service.notify({spaceHash, message: {type:"NewWhere", content:{entry,hash,author:myAgentPubKey}}}, others());
    },
    async updateWhere(spaceHash: string, idx: number, c: Coord, tag?:string) {
      const space = get(spacesStore)[spaceHash]
      const w = space.wheres[idx]
      w.entry.location = c
      if (tag != null) {
        w.entry.meta.tag = tag
      }

      const entry : WhereEntry = {
        location: JSON.stringify(w.entry.location),
        meta: w.entry.meta
      }
      const hash: HeaderHashB64 = await service.addWhere(entry, spaceHash)
      await service.deleteWhere(w.hash)
      const oldHash = w.hash
      w.hash = hash
      spacesStore.update(spaces => {
        spaces[spaceHash].wheres[idx] = w
        return spaces
      })
      await service.notify({spaceHash, message:{type:"DeleteWhere", content:oldHash}}, others());
      await service.notify({spaceHash, message:{type:"NewWhere", content:{entry, hash, author:myAgentPubKey}}}, others());
    },
    getAgentIdx (space: string, agent: string) : number {
      return get(spacesStore)[space].wheres.findIndex((w) => w.entry.meta.name == agent)
    } ,
    template(eh64: EntryHashB64): TemplateEntry {
      return get(templatesStore)[eh64];
    },
    space(space: string): Space {
      return get(spacesStore)[space];
    },
    zoom(current: string, delta: number) : void {
      zoomsStore.update(zooms => {
        if (zooms[current] + delta < 0) {
          zooms[current] = 0
        } else {
          zooms[current] += delta;
        }
        return zooms
      })
    },
    getZoom(current: string) : number {
      return get(zoomsStore)[current]
    }

  };
}
