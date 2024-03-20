use hdk::prelude::*;
use hdi::hash_path::path::TypedPath;
use zome_utils::*;
use holo_hash::EntryHashB64;

use playset_integrity::*;


pub fn get_spaces_path() -> TypedPath {
    Path::from("spaces").typed(PlaysetLinkType::Spaces).unwrap()
}


///
#[hdk_extern]
pub fn create_space(input: Space) -> ExternResult<EntryHashB64> {
    debug!("create_space(): {:?}", input);
    let _hh = create_entry(PlaysetEntry::Space(input.clone()))?;
    let space_eh = hash_entry(input.clone())?;
    let path = get_spaces_path();
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, space_eh.clone(), PlaysetLinkType::All, LinkTag::from(()))?;
    let eh64: EntryHashB64 = space_eh.clone().into();
    // let me = agent_info()?.agent_latest_pubkey.into();
    // emit_signal(&SignalPayload::new(None, me, Message::NewSpace(eh64.clone())))?;
    Ok(eh64)
}


///
#[hdk_extern]
pub fn get_space(space_eh: EntryHashB64) -> ExternResult<Option<Space>> {
    let maybe_record = get(space_eh, GetOptions::network())?;
    let Some(record) = maybe_record
        else {return Ok(None)};
    let typed = get_typed_from_record::<Space>(record)?;
    Ok(Some(typed))
}


///
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SpaceOutput {
    hash: EntryHashB64,
    content: Space,
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
    let entries = get_typed_from_links(link_input(base, PlaysetLinkType::All, None))
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut spaces = vec![];
    for pair in entries {
        spaces.push(SpaceOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(spaces)
}

