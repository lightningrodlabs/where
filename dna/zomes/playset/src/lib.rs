#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod template;
mod emoji_group;
mod svg_marker;
mod space;

pub use template::*;
pub use emoji_group::*;
pub use svg_marker::*;
pub use space::*;

entry_defs![
    PathEntry::entry_def(),
    SvgMarker::entry_def(),
    EmojiGroup::entry_def(),
    Template::entry_def(),
    Space::entry_def()
];
