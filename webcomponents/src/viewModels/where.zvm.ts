import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import { WhereBridge } from './where.bridge';
import {Coord, Play, WhereLocation, convertLocationToHere, WherePerspective, LocationInfo} from "./where.perspective";
import {DnaClient, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";
import {WhereSignal} from "./where.signals";

/**
 *
 */
export class WhereViewModel extends ZomeViewModel<WherePerspective, WhereBridge> {

  /** Ctor */
  constructor(protected _dnaClient: DnaClient) {
    super(new WhereBridge(_dnaClient));
  }

  static context = createContext<WhereViewModel>('zome_view_model/where');
  getContext(): any {return WhereViewModel.context}

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  async probeDht() {
    // n/a
  }

  /** -- Perspective -- */

  /* */
  get perspective(): WherePerspective {
    return {
      plays: this._plays,
      sessions: this._sessions,
      currentSessions: this._currentSessions,
    };
  }


  /** SpaceEh -> Play */
  private _plays: Dictionary<Play> = {};
  /** SpaceEh -> [sessionEh] */
  private _sessions: Dictionary<EntryHashB64[]> = {};
  /** SpaceEh -> sessionEh */
  private _currentSessions: Dictionary<EntryHashB64> = {};

  getPlay(eh: EntryHashB64): Play | undefined {return this._plays[eh]}
  getSessions(eh: EntryHashB64): EntryHashB64[] | undefined {return this._sessions[eh]}
  getCurrentSession(eh: EntryHashB64): EntryHashB64 | undefined {return this._currentSessions[eh]}


  /** -- Methods -- */

  /** */
  sendSignal(signal: WhereSignal, folks: Array<AgentPubKeyB64>) {
    this._bridge.notify(signal, folks)
  }




  /** */
  setCurrentSession(spaceEh: EntryHashB64, sessionEh: EntryHashB64) {
      this._currentSessions[spaceEh] = sessionEh;
      this.notify();
  }


  /** */
  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<EntryHashB64> {
    const sessionEh = await this._bridge.createNextSession(spaceEh, name);
    this.setCurrentSession(spaceEh, sessionEh);
    return sessionEh;
  }

  /** */
  async hidePlay(spaceEh: EntryHashB64) : Promise<void> {
    const _ = await this._bridge.hideSpace(spaceEh);
    this._plays[spaceEh].visible = false
    this.notify();
  }

  /** */
  async unhidePlay(spaceEh: EntryHashB64): Promise<void> {
    const _ = await this._bridge.unhideSpace(spaceEh);
    this._plays[spaceEh].visible = true
    this.notify();
  }


  /** */
  isCurrentSessionToday(spaceEh: EntryHashB64): boolean {
    const play = this.getPlay(spaceEh);
    const currentSessionEh = this.getCurrentSession(spaceEh);
    if (!play || !currentSessionEh) {
      return false;
    }
    if (play.space.meta.canModifyPast) {
      return true;
    }
    let todaySessionEh = null;
    const today = new Intl.DateTimeFormat('en-GB', {timeZone: "America/New_York"}).format(new Date())
    Object.entries(play.sessions).map(
      ([key, session]) => {
        if (session.name == today /* "dummy-test-name" */) {
          todaySessionEh = key;
        }
      })
    return todaySessionEh == currentSessionEh;
  }


  /** */
  async deleteAllMyLocations(spaceEh: EntryHashB64) {
    if (!this.isCurrentSessionToday(spaceEh)) {
      return;
    }
    const play = this.getPlay(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    let idx = 0;
    for (const locInfo of play!.sessions[sessionEh!].locations) {
      if (locInfo && locInfo.authorPubKey === this._dnaClient.myAgentPubKey) {
        await this.deleteLocation(spaceEh, idx);
      }
      idx += 1;
    }
  }


  /** */
  async deleteLocation(spaceEh: EntryHashB64, idx: number): Promise<LocationInfo> {
    const space = this.getPlay(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    if (!space || !sessionEh) {
      console.warn("deleteLocation() failed: Space or session not found", spaceEh);
      return Promise.reject("Space or session not found");
    }
    const locInfo = space.sessions[sessionEh].locations[idx]!
    await this._bridge.deleteHere(locInfo.linkAh)
    this._plays[spaceEh].sessions[sessionEh].locations[idx] = null
    this.notify();
    return locInfo;
  }


  /** */
  async publishLocation(spaceEh: EntryHashB64, location: WhereLocation) : Promise<ActionHashB64> {
    const session = await this._bridge.getSession(location.sessionEh);
    const linkAh = await this.publishLocationWithSessionIndex(location, spaceEh, session!.index)
    const locInfo: LocationInfo = { location, linkAh, authorPubKey: this._dnaClient.myAgentPubKey }
    this._plays[spaceEh].sessions[location.sessionEh].locations.push(locInfo)
    this.notify();
    return linkAh;
  }


  /** */
  private async publishLocationWithSessionIndex(location: WhereLocation, spaceEh: EntryHashB64, sessionIndex: number): Promise<ActionHashB64> {
    const entry = convertLocationToHere(location);
    return this._bridge.addHere(spaceEh, sessionIndex, entry.value, entry.meta);
  }


  /** */
  async updateLocation(spaceEh: EntryHashB64, locIdx: number, c: Coord, others: Array<AgentPubKeyB64>, tag?: string, emoji?: string) {
    const space = this.getPlay(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    if (!space || !sessionEh) {
      console.warn("updateLocation() failed: Space not found", spaceEh);
      return;
    }
    const locInfo = space.sessions[sessionEh].locations[locIdx]!
    locInfo.location.coord = c
    if (tag != null) {
      locInfo.location.meta.tag = tag
    }
    if (emoji != null) {
      locInfo.location.meta.emoji = emoji
    }
    const session = await this._bridge.getSession(sessionEh);
    const newLinkAh: ActionHashB64 = await this.publishLocationWithSessionIndex(locInfo.location, spaceEh, session!.index)
    await this._bridge.deleteHere(locInfo.linkAh)
    const oldHereAh = locInfo.linkAh;
    locInfo.linkAh = newLinkAh;
    const oldSessionEh = locInfo.location.sessionEh;
    this._plays[spaceEh].sessions[sessionEh].locations[locIdx] = locInfo;
    this.notify();
    const entry = convertLocationToHere(locInfo.location)
    await this.sendSignal({maybeSpaceHash: spaceEh, from: this._dnaClient.myAgentPubKey, message: {type: "DeleteHere", content: [oldSessionEh, oldHereAh]}},
      others);
    await this.sendSignal({maybeSpaceHash: spaceEh, from: this._dnaClient.myAgentPubKey, message: {type: "NewHere", content: {entry, linkAh: newLinkAh, author: this._dnaClient.myAgentPubKey}}},
      others);
  }


  /** Get locIdx of first location from agent with given name */
  getAgentLocIdx(spaceEh: EntryHashB64, agent: string): number {
    const sessionEh = this.getCurrentSession(spaceEh);
    const play = this.getPlay(spaceEh);
    return play!.sessions[sessionEh!].locations.findIndex((locInfo) => locInfo && locInfo.location.meta.authorName == agent)
  }

}
