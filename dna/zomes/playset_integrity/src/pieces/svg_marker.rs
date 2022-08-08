use hdi::prelude::*;

/// SvgMarker Entry
#[hdk_entry_helper]
#[derive(Clone)]
pub struct SvgMarker {
    pub name: String,
    pub value: String, // Json
}
