use hdi::prelude::*;
use holo_hash::EntryHashB64;
use std::collections::BTreeMap;

#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlacementSession {
    pub name: String,
    pub index: u32,
    pub space_eh: EntryHashB64,
}


/// Here entry definition
#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Here {
    pub value: String, // a location in some arbitrary space (Json encoded)
    pub session_eh: EntryHashB64,
    pub meta: BTreeMap<String, String>, // contextualized meaning of the value
}


// // Comment out for zits
// //#[derive(Clone, Debug, Serialize, Deserialize)]
// pub enum MarkerKind {
//     AnyEmoji,
//     Avatar,
//     Initials,
//     SingleEmoji(String),
//     SvgMarker(EntryHashB64),
//     EmojiGroup(EntryHashB64),
//     Tag,
// }
//
// // Comment out for zits
// //#[hdk_entry_helper]
// #[derive(Clone)]
// pub struct Playfield {
//     pub name: String,
//     pub space: EntryHashB64,
//     pub marker: MarkerKind,
//     pub sessions: Vec<EntryHashB64>,
//     pub meta: BTreeMap<String, String>,  // usable by the UI for whatever
// }
