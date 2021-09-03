import { serializeHash, EntryHashB64 } from '@holochain-open-dev/core-types';
import {
  observable,
  makeObservable,
  action,
  runInAction,
  computed,
} from 'mobx';
import { WhereService } from './where.service';
import { Dictionary, Space, SpaceEntry, WhereEntry, Surface } from './types';

export class WhereStore {
  @observable
  public spaces: Dictionary<Space> = {};

  constructor(protected service: WhereService) {
    makeObservable(this);
  }

  async updateSpaces() {
    const spaces = await this.service.getSpaces();
    for (let s of spaces) {
      const space : Space = {
        name : s.content.name,
        meta : s.content.meta,
        surface: JSON.parse(s.content.surface),
        wheres: await this.service.getWheres(s.hash)
      }
      this.spaces[s.hash] = space
    }
  }

  async addSpace(space: Space) {
    const s: SpaceEntry = {
      name: space.name,
      surface: JSON.stringify(space.surface),
      meta: space.meta,
    };
    const hash: EntryHashB64 = await this.service.createSpace(s)
    console.log("HASH",hash)
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



}
