pub use hdk::prelude::*;
use hc_utils::get_links_and_load_type;
use std::collections::BTreeMap;
use holo_hash::EntryHashB64;

use crate::error::*;
use crate::placement_session::*;
//use crate::signals::*;


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
    let _hh = create_entry(&input)?;
    let space_eh = hash_entry(input.clone())?;
    let path = get_spaces_path();
    path.ensure()?;
    let anchor_hash = path.path_entry_hash()?;
    create_link(anchor_hash, space_eh.clone(), ())?;
    let eh64: EntryHashB64 = space_eh.clone().into();
    // let me = agent_info()?.agent_latest_pubkey.into();
    // emit_signal(&SignalPayload::new(None, me, Message::NewSpace((eh64.clone(), input))))?;
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


#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SpaceSessionsInput {
    session_names: Vec<String>,
    space: Space,
}

#[hdk_extern]
fn create_space_with_sessions(input: SpaceSessionsInput) -> ExternResult<EntryHashB64> {
    let eh64 = create_space(input.space.clone())?;
    let mut index = 0;
    for name in input.session_names {
        create_session(input.space.clone(), name, index)?;
        index += 1;
    }
    Ok(eh64)
}

/// Returns 0 if no session found or if space does not exist
pub fn get_next_session_index(space_eh: EntryHash) -> WhereResult<u32> {
    let sessions: Vec<PlacementSession> = get_links_and_load_type(space_eh, None, false)?;
    let mut top = 0;
    for session in sessions {
        if session.index >= top {
            top = session.index + 1
        }
    }
    Ok(top)
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateNextSessionInput {
    name: String,
    space_eh: EntryHashB64,
}
#[hdk_extern]
fn create_next_session(input: CreateNextSessionInput) -> ExternResult<EntryHashB64> {
    // Make sure space exists
    let found_spaces = get_spaces(())?;
    let mut maybe_space  = None;
    for found_space in found_spaces {
        if found_space.hash == input.space_eh {
            maybe_space = Some(found_space.content);
            break;
        }
    }
    if maybe_space.is_none() {
        return error("space not found");
    }
    let next_index = get_next_session_index(input.space_eh.into())?;
    let res = create_session(maybe_space.unwrap(), input.name, next_index);
    res
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
    for link in links.iter() {
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
    let spaces = links.iter().map(|link| link.target.clone().into()).collect();
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
    let anchor_hash = path.path_entry_hash()?;
    let spaces = get_spaces_inner(anchor_hash)?;
    Ok(spaces)
}

fn get_spaces_inner(base: EntryHash) -> WhereResult<Vec<SpaceOutput>> {
    let entries = get_links_and_load_type(base, None, false)?;
    let mut spaces = vec![];
    for e in entries {
        spaces.push(SpaceOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(spaces)
}
