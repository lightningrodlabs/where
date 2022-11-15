import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import { WhereBridge } from './where.bridge';
import {HoloHashed} from "@holochain/client";
import {EmojiGroupVariant, MarkerPiece, PieceType, SpaceEntry, SvgMarkerVariant} from "./playset.bindings";
import {PlaysetEntry} from "./ludotheque.bindings";
import {Coord, Play, Space, WhereSignal, Location} from "./where.perspective";
import {DnaClient, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";
import {MarkerType} from "./playset.perspective";
import {HereEntry} from "./where.bindings";


/** */
export interface WherePerspective {
  plays: Dictionary<Play>,
  sessions: Dictionary<EntryHashB64[]>,
  currentSessions: Dictionary<EntryHashB64>,
}


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
  async deleteLocation(spaceEh: EntryHashB64, idx: number) {
    const space = this.getPlay(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    if (!space || !sessionEh) {
      console.warn("deleteLocation() failed: Space or session not found", spaceEh);
      return;
    }
    const locInfo = space.sessions[sessionEh].locations[idx]!
    await this._bridge.deleteHere(locInfo.linkAh)
    this._plays[spaceEh].sessions[sessionEh].locations[idx] = null
    this.notify();
    await this._bridge.notify({
        maybeSpaceHash: spaceEh,
        from: this._dnaClient.myAgentPubKey,
        message: {type: "DeleteHere", content: [locInfo.location.sessionEh, locInfo.linkHh]
        }},
      await this.others());
  }


  /** */
  async addLocation(location: Location, spaceEh: EntryHashB64, sessionIndex: number): Promise<ActionHashB64> {
    const entry = this.convertLocationToHere(location);
    return this._bridge.addHere(spaceEh, sessionIndex, entry.value, entry.meta);
  }


  /** */
  async updateLocation(spaceEh: EntryHashB64, locIdx: number, c: Coord, tag?: string, emoji?: string) {
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
    const newLinkHh: ActionHashB64 = await this.addLocation(locInfo.location, spaceEh, session!.index)
    await this._bridge.deleteHere(locInfo.linkAh)
    const oldHereAh = locInfo.linkAh;
    locInfo.linkAh = newLinkHh;
    const oldSessionEh = locInfo.location.sessionEh;
    this._plays[spaceEh].sessions[sessionEh].locations[locIdx] = locInfo;
    this.notify();
    const entry = this.convertLocationToHere(locInfo.location)
    await this._bridge.notify({maybeSpaceHash: spaceEh, from: this._dnaClient.myAgentPubKey, message: {type: "DeleteHere", content: [oldSessionEh, oldHereAh]}},
      await this.others());
    await this._bridge.notify({maybeSpaceHash: spaceEh, from: this._dnaClient.myAgentPubKey, message: {type: "NewHere", content: {entry, linkAh: newLinkHh, author: this._dnaClient.myAgentPubKey}}},
      await this.others());
  }


  /** Get locIdx of first location from agent with given name */
  getAgentLocIdx(spaceEh: EntryHashB64, agent: string): number {
    const sessionEh = this.getCurrentSession(spaceEh);
    const play = this.getPlay(spaceEh);
    return play!.sessions[sessionEh!].locations.findIndex((locInfo) => locInfo && locInfo.location.meta.authorName == agent)
  }


  /** */
  convertLocationToHere(location: Location) : HereEntry {
    let meta: Dictionary<string> = {};
    for (const [key, value] of Object.entries(location.meta)) {
      meta[key] = JSON.stringify(value, this.replacer)
    }
    return {
      value: JSON.stringify(location.coord),
      sessionEh: location.sessionEh,
      meta,
    } as HereEntry
  }

}
