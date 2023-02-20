import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {ProfilesProxy, WhereProfile} from "./profiles.proxy";
import { decode } from '@msgpack/msgpack';
import {AgentPubKeyB64, decodeHashFromBase64, encodeHashToBase64, EntryHashB64} from "@holochain/client";

/** */
export interface ProfilesPerspective {
  /* AgentPubKeyB64 -> Profile */
  profiles: Record<string, WhereProfile>,
}


/**
 *
 */
export class ProfilesZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = ProfilesProxy;
  get zomeProxy(): ProfilesProxy {return this._zomeProxy as ProfilesProxy;}


  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  async initializePerspectiveOnline(): Promise<void> {
    await this.probeAllProfiles();
  }

  /** */
  probeAllInner() {
    this.probeAllProfiles();
  }

  /** -- Perspective -- */

  /* */
  get perspective(): ProfilesPerspective {
    return {
      profiles: this._profiles,

    };
  }

  private _profiles: Record<string, WhereProfile> = {};


  getProfile(eh: EntryHashB64): WhereProfile | undefined {return this._profiles[eh]}

  getAgents(): AgentPubKeyB64[] { return Object.keys(this._profiles)}


  /** -- Methods -- */

  /** */
  async probeAllProfiles(): Promise<void> {
    const allAgents = await this.zomeProxy.getAgentsWithProfile();
    for (const agentPubKey of allAgents) {
      const record = await this.zomeProxy.getAgentProfile(agentPubKey);
      if (!record) {
        continue;
      }
      const profile: WhereProfile = decode((record.entry as any).Present.entry) as WhereProfile;
      this._profiles[encodeHashToBase64(agentPubKey)] = profile;
    }
    this.notifySubscribers();
  }


  /** */
  async probeProfile(agentPubKey: AgentPubKeyB64): Promise<WhereProfile | undefined> {
    const record = await this.zomeProxy.getAgentProfile(decodeHashFromBase64(agentPubKey));
    if (!record) {
      return;
    }
    const profile: WhereProfile = decode((record.entry as any).Present.entry) as WhereProfile;
    this._profiles[agentPubKey] = profile;
    this.notifySubscribers();
    return profile;
  }


  /** */
  async createMyProfile(profile: WhereProfile): Promise<void> {
    await this.zomeProxy.createProfile(profile);
    this._profiles[this.cell.agentPubKey] = profile;
    this.notifySubscribers();
  }

  /** */
  async updateMyProfile(profile: WhereProfile): Promise<void> {
    await this.zomeProxy.updateProfile(profile);
    this._profiles[this.cell.agentPubKey] = profile;
    this.notifySubscribers();
  }

}
