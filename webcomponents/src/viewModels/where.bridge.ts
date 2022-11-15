import {EntryHashB64, ActionHashB64, Dictionary, AgentPubKeyB64} from '@holochain-open-dev/core-types';
import {ZomeBridge} from "@ddd-qc/dna-client";
import {AddHereInput, HereOutput, PlacementSessionEntry} from "./where.bindings";
import {WhereSignal} from "./where.perspective";


/**
 *
 */
export class WhereBridge extends ZomeBridge {
  zomeName = "where"


  async hideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.call('hide_space', spaceEh);
  }

  async unhideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.call('unhide_space', spaceEh);
  }

  /** Space·s */


  async getHiddenSpaceList(): Promise<Array<EntryHashB64>> {
    return this.call('get_hidden_spaces', null);
  }


  /** Session */

  async getSession(sessionEh: EntryHashB64): Promise<PlacementSessionEntry | null> {
    return this.call('get_session_from_eh', sessionEh);
  }

  async getSessionAddress(spaceEh: EntryHashB64, index: number): Promise<EntryHashB64 | null> {
    return this.call('get_session', {spaceEh, index});
  }

  async getSpaceSessions(spaceEh: EntryHashB64): Promise<EntryHashB64[]> {
    return this.call('get_space_sessions', spaceEh);
  }

  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<EntryHashB64> {
    return this.call('create_next_session', {name, spaceEh});
  }


  /** Location */

  async addHere(spaceEh: EntryHashB64, sessionIndex: number, value: string, meta: Dictionary<string>): Promise<ActionHashB64> {
    return this.call('add_here', {spaceEh, sessionIndex, value, meta});
  }

  async updateHere(oldHereAh: ActionHashB64, newHere: AddHereInput): Promise<ActionHashB64> {
    return this.call('update_here', {oldHereAh, newHere});
  }

  async deleteHere(hereHh: ActionHashB64): Promise<EntryHashB64> {
    return this.call('delete_here', hereHh);
  }

  async getHeres(sessionEh: EntryHashB64): Promise<Array<HereOutput>> {
    return this.call('get_heres', sessionEh);
  }


  async notify(signal: WhereSignal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.call('notify', {signal, folks});
  }

}
