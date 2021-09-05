import { CellClient } from '@holochain-open-dev/cell-client';
import { HoloHashed, serializeHash, EntryHashB64, HeaderHashB64 } from '@holochain-open-dev/core-types';
import { CalendarEvent, Space, SpaceEntry, WhereEntry, Where, WhereInfo } from './types';

export class WhereService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'hc_zome_where'
  ) {}

  get myAgentPubKey() {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async getSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    return this.callZome('get_spaces', null);
  }

  async getWheres(space: EntryHashB64): Promise<Array<Where>> {
    const whereInfos =  await this.callZome('get_wheres', space);
    return whereInfos.map((w: WhereInfo) => {
      return {
        entry: {
          location: JSON.parse(w.entry.location),
          meta: w.entry.meta,
        },
        hash: w.hash,
        authorPubKey: w.author
      }
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



  async createCalendarEvent({
    title,
    startTime,
    endTime,
    location,
    invitees,
  }: {
    title: string;
    startTime: number;
    endTime: number;
    location?: string;
    invitees: string[];
  }): Promise<HoloHashed<CalendarEvent>> {
    const { entry_hash, entry } = await this.callZome('create_calendar_event', {
      title,
      startTime,
      endTime,
      location,
      invitees,
    });

    return {
      hash: entry_hash,
      content: entry,
    };
  }

  async getCalendarEvent(
    calendarEventHash: string
  ): Promise<HoloHashed<CalendarEvent>> {
    const calendarEvent = await this.callZome(
      'get_calendar_event',
      calendarEventHash
    );

    return {
      hash: calendarEventHash,
      content: calendarEvent,
    };
  }
  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
