pub use hdk::prelude::*;
use hc_utils::*;
use std::collections::BTreeMap;
use holo_hash::EntryHashB64;

use crate::error::*;
use crate::signals::*;

/// Space entry definition
#[hdk_entry(id = "space")]
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
    let _header_hash = create_entry(&input)?;
    let hash = hash_entry(input.clone())?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewSpace(input)))?;
    let path = get_spaces_path();
    path.ensure()?;
    let anchor_hash = path.hash()?;
    create_link(anchor_hash, hash.clone(), ())?;
    Ok(hash.into())
}

///
#[hdk_extern]
fn hide_space(space_eh64: EntryHashB64) -> ExternResult<HeaderHash> {
    let my_agent_eh = EntryHash::from(agent_info().unwrap().agent_latest_pubkey);
    return create_link(my_agent_eh, space_eh64.into(), ());
}

///
#[hdk_extern]
fn unhide_space(space_eh64: EntryHashB64) -> ExternResult<()> {
    let space_eh: EntryHash = space_eh64.into();
    let my_agent_eh = EntryHash::from(agent_info().unwrap().agent_latest_pubkey);
    let links = get_links(my_agent_eh, None)?;
    for link in links.into_inner().iter() {
        if link.target == space_eh {
            let _hash = delete_link(link.create_link_hash.clone())?;
            return Ok(());
        }
    }
    Ok(())
}

///
#[hdk_extern]
fn get_hidden_spaces(_: ()) -> ExternResult<Vec<EntryHashB64>> {
    let my_agent_eh = EntryHash::from(agent_info().unwrap().agent_latest_pubkey);
    let links = get_links(my_agent_eh, None)?;
    let spaces = links.into_inner().iter().map(|link| link.target.clone().into()).collect();
    Ok(spaces)
}

///
#[hdk_extern]
fn get_visible_spaces(_: ()) -> ExternResult<Vec<SpaceOutput>> {
    let hidden = get_hidden_spaces(())?;
    let mut visible = get_spaces(())?;
    visible.retain(|space_out| !hidden.contains(&space_out.hash));
    Ok(visible)
}

///
#[hdk_extern]
fn get_spaces(_: ()) -> ExternResult<Vec<SpaceOutput>> {
    let path = get_spaces_path();
    let anchor_hash = path.hash()?;
    let spaces = get_spaces_inner(anchor_hash)?;
    Ok(spaces)
}

fn get_spaces_inner(base: EntryHash) -> WhereResult<Vec<SpaceOutput>> {
    let entries = get_links_and_load_type(base, None)?;
    let mut spaces = vec![];
    for e in entries {
        spaces.push(SpaceOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(spaces)
}
