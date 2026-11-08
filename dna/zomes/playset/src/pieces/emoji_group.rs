use hdk::prelude::*;
use zome_utils::*;
use zome_fn_input::*;
use playset_integrity::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct EmojiGroupOutput {
    hash: EntryHashB64,
    content: EmojiGroup,
}


///
pub fn get_emoji_group_path() -> ExternResult<TypedPath> {
    Ok(Path::from("emoji-groups").typed(PlaysetLinkType::EmojiGroups)?.with_strategy(GetStrategy::Local))
}


///
#[hdk_extern]
pub fn create_emoji_group(input: EmojiGroup) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(PlaysetEntry::EmojiGroup(input.clone()))?;
    let eh = hash_entry(input.clone())?;
    let path = get_emoji_group_path()?;
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, eh.clone(), PlaysetLinkType::All, LinkTag::from(()))?;
    let eh64: EntryHashB64 = eh.clone().into();
    Ok(eh64)
}


///
#[hdk_extern]
pub fn get_emoji_group(input: ZomeFnInput<EntryHashB64>) -> ExternResult<Option<EmojiGroup>> {
    let options = input.get_options();
    let eh: EntryHash = input.input.into();
    let maybe_record = get(eh, options)?;
    let Some(record) = maybe_record
        else {return Ok(None)};
    let typed = get_typed_from_record::<EmojiGroup>(record)?;
    Ok(Some(typed))
}


///
#[hdk_extern]
pub fn get_all_emoji_groups(input: ZomeFnInput<()>) -> ExternResult<Vec<EmojiGroupOutput>> {
    let path = get_emoji_group_path()?;
    let items = get_all_inner(path.path_entry_hash()?, input.get_strategy())?;
    Ok(items)
}

fn get_all_inner(base: EntryHash, strategy: GetStrategy) -> ExternResult<Vec<EmojiGroupOutput>> {
    let entries = get_typed_from_links::<EmojiGroup>(LinkQuery::try_new(base, PlaysetLinkType::All)?, strategy)
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut items = vec![];
    for pair in entries {
        items.push(EmojiGroupOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(items)
}
