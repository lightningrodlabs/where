import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { WhereService } from './where.service';
import { Dictionary, Space, SpaceEntry, WhereEntry, Where, Location, Coord} from './types';

export interface WhereStore {
  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  spaces: Readable<Dictionary<Space>>;
  zooms: Readable<Dictionary<number>>;

  /** Actions */
  updateSpaces: () => Promise<Dictionary<Space>>;
  addSpace: (space: Space) => Promise<EntryHashB64>;
  addWhere: (spaceHash: string, where: Location) => Promise<void>;
  updateWhere: (spaceHash: string, idx: number, c: Coord) => Promise<void>;
  getAgentIdx: (space: string, agent: string) => number;
  space: (space:string) => Space;
  zoom: (current: string, delta:number) => void;
  getZoom: (current: string) => number;
}

export function createWhereStore(
  cellClient: CellClient,
  zomeName = 'hc_zome_where'
): WhereStore {
  const myAgentPubKey = serializeHash(cellClient.cellId[1]);
  const service = new WhereService(cellClient, zomeName);

  const spacesStore: Writable<Dictionary<Space>> = writable({});
  const zoomsStore: Writable<Dictionary<number>> = writable({});

  const spaces: Readable<Dictionary<Space>> = derived(spacesStore, i => i)
  const zooms: Readable<Dictionary<number>> = derived(zoomsStore, i => i)

  return {
    myAgentPubKey,
    spaces,
    zooms,
    async updateSpaces() : Promise<Dictionary<Space>> {
      const spaces = await service.getSpaces();
      for (const s of spaces) {
        const space : Space = {
          name : s.content.name,
          meta : s.content.meta,
          surface: JSON.parse(s.content.surface),
          wheres: await service.getWheres(s.hash)
        }
        spacesStore.update(spaces => {
          spaces[s.hash] = space
          return spaces
        })
        if (!get(zoomsStore)[s.hash]) {
          zoomsStore.update(zooms => {
            zooms[s.hash] = 1.0
            return zooms
          })
        }
      }
      return get(spacesStore)
    },
    async addSpace(space: Space) : Promise<EntryHashB64> {
      const s: SpaceEntry = {
        name: space.name,
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
      return hash
    },
    async addWhere(spaceHash: string, where: Location) : Promise<void> {
      const entry : WhereEntry = {
        location: JSON.stringify(where.location),
        meta: where.meta
      }
      const hash = await service.addWhere(entry, spaceHash)
      const w:Where = {entry: {location: where.location, meta:where.meta}, hash, authorPubKey: myAgentPubKey}
      console.log("added", hash)
      spacesStore.update(spaces => {
        spaces[spaceHash].wheres.push(w)
        return spaces
      })
    },
    async updateWhere(spaceHash: string, idx: number, c: Coord) {
      const space = get(spacesStore)[spaceHash]
      const w = space.wheres[idx]
      w.entry.location = c

      const entry : WhereEntry = {
        location: JSON.stringify(w.entry.location),
        meta: w.entry.meta
      }
      const hash: HeaderHashB64 = await service.addWhere(entry, spaceHash)
      await service.deleteWhere(w.hash)
      w.hash = hash
      spacesStore.update(spaces => {
        spaces[spaceHash].wheres[idx] = w
        return spaces
      })
    },
    getAgentIdx (space: string, agent: string) : number {
      return get(spacesStore)[space].wheres.findIndex((w) => w.entry.meta.name == agent)
    } ,
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
