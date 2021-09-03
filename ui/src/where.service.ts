import { AppWebsocket, CellId } from '@holochain/conductor-api';
import { HoloHashed } from '@holochain-open-dev/core-types';
import { CalendarEvent, Spaces } from './types';

export class WhereService {
  constructor(
    protected appWebsocket: AppWebsocket,
    protected cellId: CellId,
    protected zomeName = 'hc_zome_where'
  ) {}

  async getSpaces(): Promise<Array<HoloHashed<Space>>> {
    const spaces = await this.callZome('get_spaces', null);

    return events.map(
      ({ entry_hash, entry }: { entry_hash: string; entry: any }) => ({
        hash: entry_hash,
        content: entry,
      })
    );
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
  async callZome(fn_name: string, payload: any) {
    return this.appWebsocket.callZome({
      cap: null as any,
      cell_id: this.cellId,
      zome_name: this.zomeName,
      fn_name: fn_name,
      payload: payload,
      provenance: this.cellId[1],
    });
  }
}
