import {EntryHashB64, ActionHashB64, Dictionary, AgentPubKeyB64} from '@holochain-open-dev/core-types';
import {ZomeProxy} from "@ddd-qc/dna-client";
import {AddHereInput, HereOutput, PlacementSessionEntry} from "./where.bindings";
import {WhereSignal} from "./where.signals";

/**
 *
 */
export class WhereProxy extends ZomeProxy {
  zomeName = "zWhere"


  async hideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.call('hide_space', spaceEh, null);
  }

  async unhideSpace(spaceEh: EntryHashB64): Promise<EntryHashB64> {
    return this.call('unhide_space', spaceEh, null);
  }

  async getHiddenSpaces(): Promise<Array<EntryHashB64>> {
    return this.call('get_hidden_spaces', null, null);
  }


  /** Session */

  async getSessionFromEh(sessionEh: EntryHashB64): Promise<PlacementSessionEntry | null> {
    return this.call('get_session_from_eh', sessionEh, null);
  }

  async getSession(spaceEh: EntryHashB64, index: number): Promise<EntryHashB64 | null> {
    return this.call('get_session', {spaceEh, index}, null);
  }

  async getSpaceSessions(spaceEh: EntryHashB64): Promise<EntryHashB64[]> {
    return this.call('get_space_sessions', spaceEh, null);
  }

  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<[EntryHashB64, number]> {
    return this.call('create_next_session', {name, spaceEh}, null);
  }

  async createSessions(spaceEh: EntryHashB64, sessionNames: string[]): Promise<EntryHashB64[]> {
    return this.call('create_sessions', {spaceEh, sessionNames}, null);
  }


  /** Location */

  async addHere(spaceEh: EntryHashB64, sessionIndex: number, value: string, meta: Dictionary<string>): Promise<ActionHashB64> {
    return this.call('add_here', {spaceEh, sessionIndex, value, meta}, null);
  }

  async updateHere(oldHereAh: ActionHashB64, newHere: AddHereInput): Promise<ActionHashB64> {
    return this.call('update_here', {oldHereAh, newHere}, null);
  }

  async deleteHere(ah: ActionHashB64): Promise<EntryHashB64> {
    return this.call('delete_here', ah, null);
  }

  async getHeres(sessionEh: EntryHashB64): Promise<Array<HereOutput>> {
    return this.call('get_heres', sessionEh, null);
  }


  async notifyPeers(signal: WhereSignal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.call('notify_peers', {signal, folks}, null);
  }

}
