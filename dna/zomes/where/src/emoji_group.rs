use hc_utils::*;
use holo_hash::EntryHashB64;
pub use hdk::prelude::*;

use crate::error::*;
use crate::signals::*;

/// Template Entry
#[hdk_entry(id = "emojigroup")]
#[derive(Clone)]
pub struct EmojiGroup {
    pub name: String,
    pub description: String,
    pub unicodes: Vec<String>, // a one char string for an emoji unicode
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct EmojiGroupOutput {
    hash: EntryHashB64,
    content: EmojiGroup,
}

fn get_emoji_group_path() -> Path {
    Path::from("emoji-groups")
}

#[hdk_extern]
fn create_emoji_group(input: EmojiGroup) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(&input)?;
    let eh = hash_entry(input.clone())?;
    emit_signal(&SignalPayload::new(eh.clone().into(), agent_info()?.agent_latest_pubkey.into(),Message::NewEmojiGroup(input)))?;
    let path = get_emoji_group_path();
    path.ensure()?;
    let anchor_hash = path.hash()?;
    create_link(anchor_hash, eh.clone(), ())?;
    Ok(eh.into())
}

#[hdk_extern]
fn get_emoji_group(input: EntryHashB64) -> ExternResult<Option<EmojiGroup>> {
    let eh: EntryHash = input.into();
    match get_details(eh, GetOptions::content())? {
            Some(Details::Entry(EntryDetails {entry, .. })) => {
                let tmpl: EmojiGroup = entry.try_into()?;
                Ok(Some(tmpl))
            }
        _ => Ok(None),
    }
}

#[hdk_extern]
fn get_all_emoji_groups(_: ()) -> ExternResult<Vec<EmojiGroupOutput>> {
    let path = get_emoji_group_path();
    let templates = get_all_inner(path.hash()?)?;
    Ok(templates)
}

fn get_all_inner(base: EntryHash) -> WhereResult<Vec<EmojiGroupOutput>> {
    let entries = get_links_and_load_type(base, None)?;
    let mut templates = vec![];
    for e in entries {
        templates.push(EmojiGroupOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(templates)
}