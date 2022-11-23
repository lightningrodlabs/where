import {CellProxy, ZomeViewModel} from "@ddd-qc/dna-client";;
import {ProfilesProxy, WhereProfile} from "./profiles.proxy";
import {AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";
import { decode } from '@msgpack/msgpack';

/** */
export interface ProfilesPerspective {
  /* AgentPubKeyB64 -> Profile */
  profiles: Dictionary<WhereProfile>,
}


/**
 *
 */
export class ProfilesZvm extends ZomeViewModel<ProfilesPerspective, ProfilesProxy> {
  /** Ctor */
  constructor(protected _cellProxy: CellProxy) {
    super(new ProfilesProxy(_cellProxy));
  }

  /** -- ZomeViewModel -- */

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }

  /** */
  async probeAll() {
    await this.probeAllProfiles();
  }

  /** -- Perspective -- */

  /* */
  get perspective(): ProfilesPerspective {
    return {
      profiles: this._profiles,

    };
  }

  private _profiles: Dictionary<WhereProfile> = {};


  getProfile(eh: EntryHashB64): WhereProfile | undefined {return this._profiles[eh]}

  getAgents(): AgentPubKeyB64[] { return Object.keys(this._profiles)}


  /** -- Methods -- */

  /** */
  async probeAllProfiles(): Promise<void> {
    const alLRecords = await this._zomeProxy.getAllProfiles();
    for (const record of alLRecords) {
      const agent = serializeHash(record.signed_action.hashed.content.author);
      this._profiles[agent] = decode((record.entry as any).Present.entry) as WhereProfile;
    }
    this.notifySubscribers();
  }


  /** */
  async probeProfile(agentPubKey: AgentPubKeyB64): Promise<void> {
    const record = await this._zomeProxy.getAgentProfile(deserializeHash(agentPubKey));
    if (!record) {
      return;
    }
    this._profiles[agentPubKey] = decode((record.entry as any).Present.entry) as WhereProfile;
    this.notifySubscribers();
  }


  /** */
  async createMyProfile(profile: WhereProfile): Promise<void> {
    await this._zomeProxy.createProfile(profile);
    this._profiles[this.agentPubKey] = profile;
    this.notifySubscribers();
  }

  /** */
  async updateMyProfile(profile: WhereProfile): Promise<void> {
    await this._zomeProxy.updateProfile(profile);
    this._profiles[this.agentPubKey] = profile;
    this.notifySubscribers();
  }

}
