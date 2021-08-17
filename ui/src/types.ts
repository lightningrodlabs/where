// TODO: add globally available interfaces for your elements

import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

export const TODO_REPLACE_NAME_CONTEXT = 'hc_zome_todo_rename/service';

export interface CalendarEvent {
  title: string;
  createdBy: AgentPubKeyB64;
  startTime: number;
  endTime: number;
  invitees: AgentPubKeyB64[];
  location: string;
}
