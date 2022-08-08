use hdk::prelude::*;
use std::collections::BTreeMap;
use holo_hash::EntryHashB64;

use where_integrity::*;
use crate::placement_session::*;
//use crate::signals::*;


fn get_plays_path() -> Path {
  Path::from("plays")
}

#[hdk_extern]
fn create_play(input: Playfield) -> ExternResult<EntryHashB64> {
  let _hh = create_entry(WhereEntry::Playfield(&input))?;
  let eh = hash_entry(input.clone())?;
  let path = get_plays_path();
  path.ensure()?;
  let anchor_eh = path.path_entry_hash()?;
  create_link(anchor_eh, eh.clone(), WhereLinkType::All, LinkTag::from(()))?;
  let eh64: EntryHashB64 = eh.clone().into();
  // let me = agent_info()?.agent_latest_pubkey.into();
  // emit_signal(&SignalPayload::new(None, me, Message::NewPlay((eh64.clone(), input))))?;
  Ok(eh64)
}


///
#[hdk_extern]
pub fn get_play(play_eh: EntryHashB64) -> ExternResult<Option<Playfield>> {
  let eh: EntryHash = play_eh.into();
  match get_details(eh, GetOptions::content())? {
    Some(Details::Entry(EntryDetails {entry, .. })) => {
      let play: Playfield = entry.try_into()?;
      Ok(Some(play))
    }
    _ => Ok(None),
  }
}


///
#[hdk_extern]
fn get_plays(_: ()) -> ExternResult<Vec<Playfield>> {
  let path = get_spaces_path();
  let anchor_eh = path.path_entry_hash()?;
  let plays = get_plays_inner(anchor_eh)?;
  Ok(plays)
}

fn get_plays_inner(base: EntryHash) -> ExternResult<Vec<Playfield>> {
  let entries = get_typed_from_links(base, PlaysetLinkType::All, None)
    .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
  let mut spaces = vec![];
  for pair in entries {
    spaces.push(SpaceOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
  }
  Ok(spaces)
}
