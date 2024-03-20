#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod playset;
pub use playset::*;


///-------------------------------------------------------------------------------------------------
/// Declaration of this zome's entry types
///-------------------------------------------------------------------------------------------------

use hdi::prelude::*;

#[hdk_entry_types]
#[unit_enum(LudothequeEntryTypes)]
pub enum LudothequeEntry {
    #[entry_type(required_validations = 2, visibility = "public")]
    Playset(Playset),
}


///-------------------------------------------------------------------------------------------------
/// Declaration of this zome's link types
///-------------------------------------------------------------------------------------------------

/// List of all link kinds handled by this Zome
#[hdk_link_types]
#[derive(Serialize, Deserialize)]
pub enum LudothequeLinkType {
    All,
}

