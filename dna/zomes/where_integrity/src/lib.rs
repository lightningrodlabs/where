#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod entries;
pub use entries::*;


///-------------------------------------------------------------------------------------------------
/// Global consts
///-------------------------------------------------------------------------------------------------
/// DNA/Zome names
pub const WHERE_DEFAULT_ROLE_NAME: &'static str = "rWhere";
pub const WHERE_DEFAULT_COORDINATOR_ZOME_NAME: &'static str = "zWhere";
pub const WHERE_DEFAULT_INTEGRITY_ZOME_NAME: &'static str = "where_integrity";

///-------------------------------------------------------------------------------------------------
/// Declaration of this zome's entry types
///-------------------------------------------------------------------------------------------------

use hdi::prelude::*;

#[hdk_entry_types]
#[unit_enum(WhereEntryTypes)]
pub enum WhereEntry {
    #[entry_type(required_validations = 2, visibility = "public")]
    Here(Here),
    #[entry_type(required_validations = 2, visibility = "public")]
    PlacementSession(PlacementSession),
    //#[entry_type(required_validations = 2, visibility = "public")]
    //Playfield(Playfield),
}


///-------------------------------------------------------------------------------------------------
/// Declaration of this zome's link types
///-------------------------------------------------------------------------------------------------

/// List of all link kinds handled by this Zome
#[hdk_link_types]
#[derive(Serialize, Deserialize)]
pub enum WhereLinkType {
    All,
    Hide
}
