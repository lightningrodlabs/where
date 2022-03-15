use hdk::prelude::*;
use hc_utils::get_links_and_load_type;
use std::collections::BTreeMap;
use holo_hash::EntryHashB64;

/// Space entry definition
#[hdk_entry(id = "Space")]
#[derive(Clone)]
pub struct Space {
    pub name: String,
    pub origin: EntryHashB64,
    //pub dimensionality: CoordinateSystem,
    pub surface: String, // Json
    pub meta: BTreeMap<String, String>,  // usable by the UI for whatever
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SpaceOutput {
    hash: EntryHashB64,
    content: Space,
}


fn get_spaces_path() -> Path {
    Path::from("spaces")
}

#[hdk_extern]
fn create_space(input: Space) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(&input)?;
    let space_eh = hash_entry(input.clone())?;
    let path = get_spaces_path();
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, space_eh.clone(), ())?;
    let eh64: EntryHashB64 = space_eh.clone().into();
    // let me = agent_info()?.agent_latest_pubkey.into();
    // emit_signal(&SignalPayload::new(None, me, Message::NewSpace(eh64.clone())))?;
    Ok(eh64)
}

///
#[hdk_extern]
pub fn get_space(space_eh: EntryHashB64) -> ExternResult<Option<Space>> {
    let eh: EntryHash = space_eh.into();
    match get_details(eh, GetOptions::content())? {
        Some(Details::Entry(EntryDetails {entry, .. })) => {
            let space: Space = entry.try_into()?;
            Ok(Some(space))
        }
        _ => Ok(None),
    }
}



///
#[hdk_extern]
fn get_spaces(_: ()) -> ExternResult<Vec<SpaceOutput>> {
    let path = get_spaces_path();
    let anchor_eh = path.path_entry_hash()?;
    let spaces = get_spaces_inner(anchor_eh)?;
    Ok(spaces)
}

fn get_spaces_inner(base: EntryHash) -> ExternResult<Vec<SpaceOutput>> {
    let entries = get_links_and_load_type(base, None, false)
      .map_err(|err| WasmError::Guest(err.to_string()))?;
    let mut spaces = vec![];
    for e in entries {
        spaces.push(SpaceOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(spaces)
}

