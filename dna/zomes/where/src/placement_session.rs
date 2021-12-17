use hdk::prelude::*;

use hc_utils::*;
use holo_hash::{EntryHashB64};

use crate::{
  space::*,
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

/// Argument is a Space so we are sure the hh is valid
pub fn create_session(space: Space, name: String, index: u32) -> ExternResult<EntryHashB64> {
  let space_eh = hash_entry(space.clone())?;
  let session = PlacementSession{ name, index, space_eh: space_eh.clone().into() };
  let session_eh = hash_entry(session.clone())?;
  let _hh = create_entry(session.clone())?;

  let tag = format!("{}", index).as_bytes().to_vec();
  create_link(space_eh.clone(), session_eh.clone(), tag)?;
  let eh64: EntryHashB64 = session_eh.clone().into();
  // let me = agent_info()?.agent_latest_pubkey.into();
  // emit_signal(&SignalPayload::new(None, me, Message::NewSession((eh64.clone(), session))))?;
  Ok(eh64)
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
  let tag = format!("{}", input.index).as_bytes().to_vec();
  let links = get_links(input.space_eh.clone().into(), Some(tag.clone().into()))?;
  if links.len() == 0 {
    debug!("Session {} not found for space '{:?}' when adding Here", input.index, input.space_eh);
    return Ok(None);
  }
  let mut maybe_session = None;
  for link in links {
    if link.tag == tag.clone().into() {
      maybe_session = Some(link.target.into());
      break;
    }
  }
  Ok(maybe_session)
}

///
#[hdk_extern]
pub fn get_session_from_eh(eh: EntryHashB64) -> ExternResult<Option<PlacementSession>> {
  let maybe_session = match get_latest_entry(eh.clone().into(), Default::default()) {
    Ok(entry) => match PlacementSession::try_from(entry.clone()) {
      Ok(e) => {Some(e)},
      Err(_) => return error("No PlacementSession found at given EntryHash"),
    },
    _ => return Ok(None),
  };
  Ok(maybe_session)
}


///
#[hdk_extern]
pub fn get_all_sessions(space_eh: EntryHashB64) -> ExternResult<Vec<EntryHashB64>> {
  // make sure there is a space at given address
  match get_latest_entry(space_eh.clone().into(), Default::default()) {
    Ok(entry) => match Space::try_from(entry.clone()) {
      Ok(_space) => {},
      Err(_) => return error("get_all_sessions(): No Space found at given EntryHash"),
    },
    Err(_e) => return error("get_all_sessions(): No entry found at given EntryHash"),
  }
  // get links
  let links = get_links(space_eh.into(), None)?;
  let sessions = links.iter().map(|link| link.target.clone().into()).collect();
  Ok(sessions)
}
