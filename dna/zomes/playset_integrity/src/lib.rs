#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

pub mod pieces;
pub use pieces::*;


///-------------------------------------------------------------------------------------------------
/// Declaration of this zome's entry types
///-------------------------------------------------------------------------------------------------

use hdi::prelude::*;

#[hdk_entry_defs]
#[unit_enum(PlaysetTypes)]
pub enum PlaysetEntry {
    #[entry_def(required_validations = 2, visibility = "public")]
    SvgMarker(SvgMarker),
    #[entry_def(required_validations = 2, visibility = "public")]
    EmojiGroup(EmojiGroup),
    #[entry_def(required_validations = 2, visibility = "public")]
    Template(Template),
    #[entry_def(required_validations = 2, visibility = "public")]
    Space(Space),
}


///-------------------------------------------------------------------------------------------------
/// Declaration of this zome's link types
///-------------------------------------------------------------------------------------------------

/// List of all link kinds handled by this Zome
#[hdk_link_types]
pub enum PlaysetLinkType {
    All,
    SvgMarkers,
    EmojiGroups,
    Spaces,
    Templates,
}
