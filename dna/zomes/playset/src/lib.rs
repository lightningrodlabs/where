#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod pieces;
mod import_piece;
mod export_piece;
mod export_space;

pub use pieces::*;
pub use export_piece::*;


entry_defs![
    PathEntry::entry_def(),
    SvgMarker::entry_def(),
    EmojiGroup::entry_def(),
    Template::entry_def(),
    Space::entry_def()
];
