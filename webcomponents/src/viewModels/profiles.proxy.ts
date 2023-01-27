import { AgentPubKey, Record as HcRecord } from '@holochain/client';
import {ZomeProxy} from "@ddd-qc/lit-happ";

export interface WhereProfile {
  nickname: string;
  fields: Record<string, string>;
}


/**
 *
 */
export class ProfilesProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "zProfiles"
  static readonly FN_NAMES = [
    "entry_defs",
    'create_profile',
    'update_profile',
    "search_agents",
    "get_agent_profile",
    "get_agents_with_profile",
  ];


  async createProfile(profile: WhereProfile): Promise<HcRecord> {
    return this.call('create_profile', profile);
  }

  async updateProfile(profile: WhereProfile): Promise<HcRecord> {
    return this.call('update_profile', profile);
  }

  async searchAgents(nickname_filter: string): Promise<AgentPubKey[]> {
    return this.call('search_agents', {nickname_filter});
  }

  async getAgentProfile(agentPubKey: AgentPubKey): Promise<HcRecord | null > {
    return this.call('get_agent_profile', agentPubKey);
  }

  async getAgentsWithProfile(): Promise<AgentPubKey[]> {
    return this.call('get_agents_with_profile', null);
  }

}
