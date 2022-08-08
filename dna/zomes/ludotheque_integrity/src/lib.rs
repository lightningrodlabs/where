#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod playset;
pub use playset::*;


//--------------------------------------------------------------------------------------------------
use hdi::prelude::*;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum LudothequeEntry {
    #[entry_def(required_validations = 2, visibility = "public")]
    Playset(Playset),
}


/// List of all link kinds handled by this Zome
#[hdk_link_types]
#[derive(Serialize, Deserialize)]
pub enum LudothequeLinkType {
    All,
}

