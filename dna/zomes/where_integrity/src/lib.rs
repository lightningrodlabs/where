#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

//pub mod error;
pub mod here;
pub mod placement_session;
//pub mod playfield;

pub use here::*;
//pub use playfield::*;
pub use placement_session::*;


//--------------------------------------------------------------------------------------------------

use hdi::prelude::*;

pub const PLAYSET_ZOME_NAME: &'static str = "where_playset";


#[hdk_entry_defs]
#[unit_enum(WhereEntryTypes)]
pub enum WhereEntry {
    #[entry_def(required_validations = 2, visibility = "public")]
    Here(Here),
    #[entry_def(required_validations = 2, visibility = "public")]
    PlacementSession(PlacementSession),
    //#[entry_def(required_validations = 2, visibility = "public")]
    //Playfield(Playfield),
}


/// List of all link kinds handled by this Zome
#[hdk_link_types]
#[derive(Serialize, Deserialize)]
pub enum WhereLinkType {
    All,
    Hide
}
