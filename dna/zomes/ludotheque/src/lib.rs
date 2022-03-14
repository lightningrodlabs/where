#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdk::prelude::*;

mod playset;

pub use playset::*;

entry_defs![
    PathEntry::entry_def(),
    Playset::entry_def()
];
