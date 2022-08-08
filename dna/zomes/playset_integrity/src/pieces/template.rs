use hdi::prelude::*;

/// Template Entry
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Template {
    pub name: String,
    pub surface: String, // Json
}
