use hdk::prelude::*;
use hc_utils::get_latest_entry;
use hc_utils::get_links_and_load_type;
use holo_hash::EntryHashB64;

use crate::{
  error::*,
  //signals::*,
};


/// Entry definition
#[hdk_entry(id = "placement-session")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlacementSession {
  pub name: String,
  pub index: u32,
  pub space_eh: EntryHashB64,
}


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSessionInput {
  pub space_eh: EntryHashB64,
  pub index: u32,
}

///
#[hdk_extern]
pub fn get_session(input: GetSessionInput) -> ExternResult<Option<EntryHashB64>> {
  /// Make sure its a space
  let _ = is_valid_space(input.space_eh.clone().into())?;
  /// Get session at index
  let tag: LinkTag = format!("{}", input.index).as_bytes().to_vec().into();
  let links = get_links(input.space_eh.clone().into(), Some(tag.clone()))?;
  if links.len() == 0 {
    debug!("get_session(): Session {} not found for space '{:?}'", input.index, input.space_eh);
    return Ok(None);
  }
  let mut maybe_session = None;
  for link in links {
    if link.tag == tag.clone() {
      maybe_session = Some(link.target.into());
      break;
    }
  }
  Ok(maybe_session)
}

///
#[hdk_extern]
pub fn get_session_from_eh(session_eh: EntryHashB64) -> ExternResult<Option<PlacementSession>> {
  let maybe_session = match get_latest_entry(session_eh.clone().into(), Default::default()) {
    Ok(entry) => match PlacementSession::try_from(entry.clone()) {
      Ok(e) => {Some(e)},
      Err(_) => return error(&format!("No PlacementSession found at given EntryHash: {:?}", session_eh)),
    },
    _ => return Ok(None),
  };
  Ok(maybe_session)
}


///
#[hdk_extern]
pub fn get_space_sessions(space_eh: EntryHashB64) -> ExternResult<Vec<EntryHashB64>> {
  /// Make sure its a space
  let _ = is_valid_space(space_eh.clone().into())?;
  // get links
  let links = get_links(space_eh.into(), None)?;
  let sessions = links.iter().map(|link| link.target.clone().into()).collect();
  Ok(sessions)
}


pub fn is_valid_space(space_eh: EntryHash) -> ExternResult<()> {
  let entry_type = zome_utils::get_entry_type_from_eh(space_eh)?;
  let valid_type = zome_utils::is_type(entry_type, "where_playset", "space")?;
  if !valid_type {
    return error("input.space_eh does not point to a space entry")
  }
  Ok(())
}


#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SpaceSessionsInput {
  session_names: Vec<String>,
  space_eh: EntryHashB64,
}

#[hdk_extern]
fn create_sessions(input: SpaceSessionsInput) -> ExternResult<()> {
  /// Make sure its a space
  let _ = is_valid_space(input.space_eh.clone().into())?;
  /// Create each session
  let mut index = 0;
  for name in input.session_names {
    create_session(input.space_eh.clone().into(), name, index)?;
    index += 1;
  }
  Ok(())
}


/// Argument is a Space so we are sure the hh is valid
pub fn create_session(space_eh: EntryHash, name: String, index: u32) -> ExternResult<EntryHashB64> {
  let session = PlacementSession { name, index, space_eh: space_eh.clone().into() };
  let session_eh = hash_entry(session.clone())?;
  let _hh = create_entry(session.clone())?;
  let tag = format!("{}", index).as_bytes().to_vec();
  create_link(space_eh.clone(), session_eh.clone(), tag)?;
  let eh64: EntryHashB64 = session_eh.clone().into();
  // let me = agent_info()?.agent_latest_pubkey.into();
  // emit_signal(&SignalPayload::new(None, me, Message::NewSession((eh64.clone(), session))))?;
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
  let space_eh: EntryHash = input.space_eh.into();
  let next_index = get_next_session_index(space_eh.clone())?;
  let res = create_session(space_eh, input.name, next_index);
  res
}
