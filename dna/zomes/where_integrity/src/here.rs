use hdi::prelude::*;
use holo_hash::{EntryHashB64};
use std::collections::BTreeMap;


/// Here entry definition
#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Here {
    pub value: String, // a location in some arbitrary space (Json encoded)
    pub session_eh: EntryHashB64,
    pub meta: BTreeMap<String, String>, // contextualized meaning of the value
}
