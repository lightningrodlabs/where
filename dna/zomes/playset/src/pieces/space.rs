use hdk::prelude::*;
use zome_utils::*;
use zome_fn_input::*;
use playset_integrity::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SpaceOutput {
    hash: EntryHashB64,
    content: Space,
}


///
pub fn get_spaces_path() -> ExternResult<TypedPath> {
    Ok(Path::from("spaces").typed(PlaysetLinkType::Spaces)?.with_strategy(GetStrategy::Local))
}


///
#[hdk_extern]
pub fn create_space(input: Space) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(PlaysetEntry::Space(input.clone()))?;
    let eh = hash_entry(input.clone())?;
    let path = get_spaces_path()?;
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, eh.clone(), PlaysetLinkType::All, LinkTag::from(()))?;
    let eh64: EntryHashB64 = eh.clone().into();
    Ok(eh64)
}


///
#[hdk_extern]
pub fn get_space(input: ZomeFnInput<EntryHashB64>) -> ExternResult<Option<Space>> {
    let options = input.get_options();
    let eh: EntryHash = input.input.into();
    let maybe_record = get(eh, options)?;
    let Some(record) = maybe_record
        else {return Ok(None)};
    let typed = get_typed_from_record::<Space>(record)?;
    Ok(Some(typed))
}


///
#[hdk_extern]
pub fn get_spaces(input: ZomeFnInput<()>) -> ExternResult<Vec<SpaceOutput>> {
    let path = get_spaces_path()?;
    let items = get_spaces_inner(path.path_entry_hash()?, input.get_strategy())?;
    Ok(items)
}

fn get_spaces_inner(base: EntryHash, strategy: GetStrategy) -> ExternResult<Vec<SpaceOutput>> {
    let entries = get_typed_from_links::<Space>(LinkQuery::try_new(base, PlaysetLinkType::All)?, strategy)
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut items = vec![];
    for pair in entries {
        items.push(SpaceOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(items)
}
