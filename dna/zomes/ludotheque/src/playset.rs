use hdk::prelude::*;
use hc_utils::get_links_and_load_type;
use holo_hash::EntryHashB64;

/// Template Entry
#[hdk_entry(id = "playset")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Playset {
  pub name: String,
  pub description: String,
  pub templates: Vec<EntryHashB64>,
  pub svg_markers: Vec<EntryHashB64>,
  pub emoji_groups: Vec<EntryHashB64>,
  pub spaces: Vec<EntryHashB64>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct PlaysetOutput {
  hash: EntryHashB64,
  content: Playset,
}


fn get_playset_path() -> Path {
  Path::from("playsets")
}

#[hdk_extern]
fn create_playset(input: Playset) -> ExternResult<EntryHashB64> {
  let _hh = create_entry(&LudothequeEntry::Playset(input))?;
  let eh = hash_entry(input.clone())?;
  let path = get_playset_path();
  path.ensure()?;
  let anchor_eh = path.path_entry_hash()?;
  create_link(anchor_eh, eh.clone(), ())?;
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
  let entries = get_links_and_load_type(base, None, false)
    .map_err(|err| WasmError::Guest(err.to_string()))?;
  let mut playsets = vec![];
  for e in entries {
    playsets.push(PlaysetOutput {hash: hash_entry(&e)?.into(), content: e});
  }
  Ok(playsets)
}
