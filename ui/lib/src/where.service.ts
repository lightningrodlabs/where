import { CellClient } from '@holochain-open-dev/cell-client';
import { HoloHashed, serializeHash, EntryHashB64, HeaderHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { SpaceEntry, Space, WhereEntry, Where, WhereInfo, Signal } from './types';

export class WhereService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'hc_zome_where'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async getSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    return this.callZome('get_spaces', null);
  }

  async getWheres(space: EntryHashB64): Promise<Array<Where>> {
    const whereInfos =  await this.callZome('get_wheres', space);
    return whereInfos.map((info: WhereInfo) => {
      return this.whereFromInfo(info)
    });
  }

  async addWhere(where: WhereEntry, space: EntryHashB64): Promise<HeaderHashB64> {
    return this.callZome('add_where', {entry: where, space});
  }

  async deleteWhere(where: HeaderHashB64): Promise<EntryHashB64> {
    return this.callZome('delete_where', where);
  }


  async createSpace(space: SpaceEntry): Promise<EntryHashB64> {
    return this.callZome('create_space', space);
  }

  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  async spaceFromEntry(hash: EntryHashB64, entry: SpaceEntry): Promise<Space> {
    return {
      name : entry.name,
      meta : entry.meta,
      surface: JSON.parse(entry.surface),
      wheres: await this.getWheres(hash)
    }
  }

  whereFromInfo(info: WhereInfo) : Where {
    return {
      entry: {
        location: JSON.parse(info.entry.location),
        meta: info.entry.meta,
      },
      hash: info.hash,
      authorPubKey: info.author,
    }
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
