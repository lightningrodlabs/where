use hdk::prelude::*;
use zome_utils::*;
use zome_fn_input::*;

use ludotheque_integrity::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct PlaysetOutput {
  hash: EntryHashB64,
  content: Playset,
}


///
fn get_playset_path() -> ExternResult<TypedPath> {
  Ok(Path::from("playsets").typed(LudothequeLinkType::All)?.with_strategy(GetStrategy::Local))
}


///
#[hdk_extern]
fn create_playset(input: Playset) -> ExternResult<EntryHashB64> {
  let _hh = create_entry(&LudothequeEntry::Playset(input.clone()))?;
  let eh = hash_entry(input.clone())?;
  let path = get_playset_path()?;
  path.ensure()?;
  let anchor_eh = path.path_entry_hash()?;
  create_link(anchor_eh, eh.clone(), LudothequeLinkType::All, LinkTag::from(()))?;
  let eh64: EntryHashB64 = eh.clone().into();
  Ok(eh64)
}


#[hdk_extern]
fn get_playset(input: ZomeFnInput<EntryHashB64>) -> ExternResult<Option<Playset>> {
  let options = input.get_options();
  let eh: EntryHash = input.input.into();
  let maybe_record = get(eh, options)?;
  let Some(record) = maybe_record
      else {return Ok(None)};
  let typed = get_typed_from_record::<Playset>(record)?;
  Ok(Some(typed))
}


#[hdk_extern]
fn get_all_playsets(input: ZomeFnInput<()>) -> ExternResult<Vec<PlaysetOutput>> {
  let path = get_playset_path()?;
  let playsets = get_all_inner(path.path_entry_hash()?, input.get_strategy())?;
  Ok(playsets)
}

fn get_all_inner(base: EntryHash, strategy: GetStrategy) -> ExternResult<Vec<PlaysetOutput>> {
  let entries = get_typed_from_links::<Playset>(LinkQuery::try_new(base, LudothequeLinkType::All)?, strategy)
    .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
  let mut playsets = vec![];
  for pair in entries {
    playsets.push(PlaysetOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
  }
  Ok(playsets)
}
