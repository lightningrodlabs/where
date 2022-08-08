use hdi::prelude::*;

/// EmojiGroup Entry
#[hdk_entry_helper]
#[derive(Clone)]
pub struct EmojiGroup {
    pub name: String,
    pub description: String,
    pub unicodes: Vec<String>, // a one char string for an emoji unicode
}
