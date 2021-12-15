use hdk::prelude::*;

use holo_hash::{EntryHashB64};

use crate::{
  space::*,
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

/// Input is space so we are sure the hash is valid
pub fn create_session(space: Space, name: String, index: u32) -> ExternResult<EntryHashB64> {
  let space_eh = hash_entry(space.clone())?;
  let session = PlacementSession{ name, index, space_eh: space_eh.clone().into() };
  let session_eh = hash_entry(session.clone())?;
  let _hh = create_entry(session)?;

  let tag = format!("{}", index).as_bytes().to_vec();
  create_link(space_eh.clone(), session_eh.clone(), tag)?;
  Ok(session_eh.into())
}


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSessionInput {
  pub space_eh: EntryHashB64,
  pub index: u32,
}

///
#[hdk_extern]
pub fn get_session(input: GetSessionInput) -> ExternResult<Option<EntryHash>> {
  let tag = format!("{}", input.index).as_bytes().to_vec();
  let links = get_links(input.space_eh.clone().into(), Some(tag.clone().into()))?;
  if links.len() == 0 {
    debug!("Session {} not found for space '{:?}' when adding Here", input.index, input.space_eh);
    return Ok(None);
  }
  let mut maybe_session = None;
  for link in links {
    if link.tag == tag.clone().into() {
      maybe_session = Some(link.target);
      break;
    }
  }
  Ok(maybe_session)
}
