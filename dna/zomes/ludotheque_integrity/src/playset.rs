use hdi::prelude::*;
use holo_hash::EntryHashB64;

/// Playset Entry
#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Playset {
  pub name: String,
  pub description: String,
  pub templates: Vec<EntryHashB64>,
  pub svg_markers: Vec<EntryHashB64>,
  pub emoji_groups: Vec<EntryHashB64>,
  pub spaces: Vec<EntryHashB64>,
}
