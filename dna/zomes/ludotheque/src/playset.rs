use hdk::hash_path::path::TypedPath;
use hdk::prelude::*;
use holo_hash::EntryHashB64;
use zome_utils::get_typed_from_links;

use ludotheque_integrity::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct PlaysetOutput {
  hash: EntryHashB64,
  content: Playset,
}


///
fn get_playset_path() -> TypedPath {
  Path::from("playsets").typed(LudothequeLinkType::All).unwrap()
}


///
#[hdk_extern]
fn create_playset(input: Playset) -> ExternResult<EntryHashB64> {
  let _hh = create_entry(&LudothequeEntry::Playset(input.clone()))?;
  let eh = hash_entry(input.clone())?;
  let path = get_playset_path();
  path.ensure()?;
  let anchor_eh = path.path_entry_hash()?;
  create_link(anchor_eh, eh.clone(), LudothequeLinkType::All, LinkTag::from(()))?;
  let eh64: EntryHashB64 = eh.clone().into();
  // let me = agent_info()?.agent_latest_pubkey.into();
  // emit_signal(&SignalPayload::new(None, me, eh64)?;
  Ok(eh64)
}


#[hdk_extern]
fn get_playset(input: EntryHashB64) -> ExternResult<Option<Playset>> {
  let eh: EntryHash = input.into();
  match get_details(eh, GetOptions::content())? {
    Some(Details::Entry(EntryDetails {entry, .. })) => {
      let obj: Playset = entry.try_into()?;
      Ok(Some(obj))
    }
    _ => Ok(None),
  }
}


#[hdk_extern]
fn get_all_playsets(_: ()) -> ExternResult<Vec<PlaysetOutput>> {
  let path = get_playset_path();
  let playsets = get_all_inner(path.path_entry_hash()?)?;
  Ok(playsets)
}

fn get_all_inner(base: EntryHash) -> ExternResult<Vec<PlaysetOutput>> {
  let entries = get_typed_from_links(base, LudothequeLinkType::All, None)
    .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
  let mut playsets = vec![];
  for pair in entries {
    playsets.push(PlaysetOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
  }
  Ok(playsets)
}
