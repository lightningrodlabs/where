import {EntryHashB64} from "@holochain-open-dev/core-types";

export interface Playset {
  name: string;
  description: string;
  templates: EntryHashB64[];
  svgMarkers: EntryHashB64[];
  emojiGroups: EntryHashB64[];
  spaces: EntryHashB64[];
}
