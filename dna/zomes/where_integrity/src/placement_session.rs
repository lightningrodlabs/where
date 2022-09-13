use hdi::prelude::*;
use holo_hash::EntryHashB64;


#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlacementSession {
  pub name: String,
  pub index: u32,
  pub space_eh: EntryHashB64,
}
