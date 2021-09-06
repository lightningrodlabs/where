import { EntryHashB64, HeaderHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import {
  observable,
  makeObservable,
  action,
  runInAction,
  computed,
} from 'mobx';
import { WhereService } from './where.service';
import { Dictionary, Space, SpaceEntry, WhereEntry, Where, Location} from './types';

export class WhereStore {
  @observable
  public spaces: Dictionary<Space> = {};

  @observable
  public zooms: Dictionary<number> = {};

  constructor(protected service: WhereService) {
    makeObservable(this);
  }

  async updateSpaces() {
    const spaces = await this.service.getSpaces();
    for (const s of spaces) {
      const space : Space = {
        name : s.content.name,
        meta : s.content.meta,
        surface: JSON.parse(s.content.surface),
        wheres: await this.service.getWheres(s.hash)
      }
      this.spaces[s.hash] = space
      if (!this.zooms[s.hash]) {
        this.zooms[s.hash] = 1.0
      }
    }
  }

  async addSpace(space: Space) {
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
  }

  get myAgentPubKey() {
    return this.service.myAgentPubKey;
  }

  async addWhere(spaceHash: string, where: Location) {
    const entry : WhereEntry = {
      location: JSON.stringify(where.location),
      meta: where.meta
    }
    const hash = await this.service.addWhere(entry, spaceHash)
    const w:Where = {entry: {location: where.location, meta:where.meta}, hash, authorPubKey: this.myAgentPubKey}
    console.log("added", hash)
    this.spaces[spaceHash].wheres.push(w)
  }

  async updateWhere(spaceHash: string, idx: number, x: number, y: number) {
    const space = this.spaces[spaceHash]
    const w = space.wheres[idx]
    w.entry.location.x = x
    w.entry.location.y = y

    const entry : WhereEntry = {
      location: JSON.stringify(w.entry.location),
      meta: w.entry.meta
    }
    const hash: HeaderHashB64 = await this.service.addWhere(entry, spaceHash)
    await this.service.deleteWhere(w.hash)
    w.hash = hash
  }

  getAgentIdx(space: string, agent: string) : number {
    return this.spaces[space].wheres.findIndex((w) => w.entry.meta.name == agent)
  }

  space(space: string): Space {
    return this.spaces[space];
  }

}
