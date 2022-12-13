use hdi::prelude::*;
use std::collections::BTreeMap;
use holo_hash::EntryHashB64;

// Comment out for zits
//#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum MarkerKind {
  AnyEmoji,
  Avatar,
  Initials,
  SingleEmoji(String),
  SvgMarker(EntryHashB64),
  EmojiGroup(EntryHashB64),
  Tag,
}

// Comment out for zits
//#[hdk_entry_helper]
#[derive(Clone)]
pub struct Playfield {
  pub name: String,
  pub space: EntryHashB64,
  pub marker: MarkerKind,
  pub sessions: Vec<EntryHashB64>,
  pub meta: BTreeMap<String, String>,  // usable by the UI for whatever
}
