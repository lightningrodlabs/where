use hdk::prelude::*;
use hdk::hash_path::path::TypedPath;
use zome_utils::*;
use holo_hash::EntryHashB64;

use playset_integrity::*;


///
pub fn is_valid_space(space_eh: EntryHash) -> ExternResult<()> {
    let entry_type = get_entry_type_from_eh(space_eh)?;
    if entry_type != UnitEntryTypes::Space.try_into().unwrap() {
        return Err(wasm_error!(WasmErrorInner::Guest("input.space_eh does not point to a space entry".to_string())));
    }
    Ok(())
}


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
    let entries = get_typed_from_links(base, PlaysetLinkType::All, None)
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut spaces = vec![];
    for pair in entries {
        spaces.push(SpaceOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(spaces)
}

