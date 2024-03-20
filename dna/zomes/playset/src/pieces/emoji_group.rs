use hdk::prelude::*;
use hdi::hash_path::path::TypedPath;
use holo_hash::EntryHashB64;
use zome_utils::*;
use playset_integrity::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct EmojiGroupOutput {
    hash: EntryHashB64,
    content: EmojiGroup,
}


///
pub fn get_emoji_group_path() -> TypedPath {
    Path::from("emoji-groups").typed(PlaysetLinkType::EmojiGroups).unwrap()
}


///
#[hdk_extern]
pub fn create_emoji_group(input: EmojiGroup) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(&PlaysetEntry::EmojiGroup(input.clone()))?;
    let eh = hash_entry(input.clone())?;
    let path = get_emoji_group_path();
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, eh.clone(), PlaysetLinkType::All, LinkTag::from(()))?;
    let eh64: EntryHashB64 = eh.clone().into();
    // let me = agent_info()?.agent_latest_pubkey.into();
    // emit_signal(&SignalPayload::new(None, me, Message::NewEmojiGroup((eh64.clone(), input))))?;
    Ok(eh64)
}


///
#[hdk_extern]
fn get_emoji_group(input: EntryHashB64) -> ExternResult<Option<EmojiGroup>> {
    let maybe_record = get(input, GetOptions::network())?;
    let Some(record) = maybe_record
        else {return Ok(None)};
    let typed = get_typed_from_record::<EmojiGroup>(record)?;
    Ok(Some(typed))
}


///
#[hdk_extern]
fn get_all_emoji_groups(_: ()) -> ExternResult<Vec<EmojiGroupOutput>> {
    let path = get_emoji_group_path();
    let groups = get_all_inner(path.path_entry_hash()?)?;
    Ok(groups)
}

fn get_all_inner(base: EntryHash) -> ExternResult<Vec<EmojiGroupOutput>> {
    let entries = get_typed_from_links(link_input(base, PlaysetLinkType::All, None))
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut groups = vec![];
    for pair in entries {
        groups.push(EmojiGroupOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(groups)
}
