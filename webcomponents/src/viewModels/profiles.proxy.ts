import { AgentPubKey, Record as HcRecord } from '@holochain/client';
import {ZomeProxy} from "@ddd-qc/dna-client";

export interface WhereProfile {
  nickname: string;
  fields: Record<string, string>;
}


/**
 *
 */
export class ProfilesProxy extends ZomeProxy {
  zomeName = "zProfiles"


  async getMyProfile(): Promise<HcRecord> {
    return this.call('get_my_profile', null, null);
  }


  async getAgentProfile(agentPubKey: AgentPubKey): Promise<HcRecord | undefined> {
    return this.call('get_agent_profile', agentPubKey, null);
  }


  async getAgentsProfiles(agentPubKeys: AgentPubKey[]): Promise<HcRecord[]> {
    return this.call('get_agents_profiles', agentPubKeys, null);
  }


  async searchProfiles(nicknamePrefix: string): Promise<Array<HcRecord>> {
    return this.call('search_profiles', {nickname_prefix: nicknamePrefix}, null);
  }


  async getAllProfiles(): Promise<HcRecord[]> {
    return this.call('get_all_profiles', null, null);
  }


  async createProfile(profile: WhereProfile): Promise<HcRecord> {
    return this.call('create_profile', profile, null);
  }


  async updateProfile(profile: WhereProfile): Promise<HcRecord> {
    return this.call('update_profile', profile, null);
  }
}
