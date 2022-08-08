use hdi::prelude::*;
use std::collections::BTreeMap;
use holo_hash::EntryHashB64;

use crate::pieces::MarkerPiece;

/// Space entry definition
#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Space {
    pub name: String,
    pub origin: EntryHashB64,
    //pub dimensionality: CoordinateSystem,
    pub surface: String, // Json
    pub maybe_marker_piece: Option<MarkerPiece>,
    pub meta: BTreeMap<String, String>,  // usable by the UI for whatever
}

