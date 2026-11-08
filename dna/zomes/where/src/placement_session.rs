use hdk::prelude::*;
use zome_utils::*;
use zome_fn_input::*;

use where_integrity::*;


#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSessionInput {
  pub space_eh: EntryHashB64,
  pub index: u32,
}

///
#[hdk_extern]
pub fn get_session(input: ZomeFnInput<GetSessionInput>) -> ExternResult<Option<EntryHashB64>> {
  let strategy = input.get_strategy();
  get_session_inner(input.input, strategy)
}

///
pub fn get_session_inner(input: GetSessionInput, strategy: GetStrategy) -> ExternResult<Option<EntryHashB64>> {
  let space_eh: EntryHash = input.space_eh.clone().into();
  /// Make sure its a space
  is_valid_space(space_eh.clone(), strategy)?;
  /// Get session at index
  let tag: LinkTag = format!("{}", input.index).as_bytes().to_vec().into();
  let query = LinkQuery::try_new(space_eh, WhereLinkType::All)?.tag_prefix(tag.clone());
  let links = get_links(query, strategy)?;
  if links.len() == 0 {
    debug!("get_session(): Session {} not found for space '{:?}'", input.index, input.space_eh);
    return Ok(None);
  }
  for link in links {
    if link.tag == tag {
      if let Some(eh) = link.target.into_entry_hash() {
        return Ok(Some(eh.into()));
      }
    }
  }
  Ok(None)
}

/// Used by write paths: look locally first, then ask the network
pub fn get_session_local_or_network(input: GetSessionInput) -> ExternResult<Option<EntryHashB64>> {
  if let Ok(Some(eh)) = get_session_inner(input.clone(), GetStrategy::Local) {
    return Ok(Some(eh));
  }
  get_session_inner(input, GetStrategy::Network)
}

///
#[hdk_extern]
pub fn get_session_from_eh(input: ZomeFnInput<EntryHashB64>) -> ExternResult<Option<PlacementSession>> {
  let strategy = input.get_strategy();
  get_session_from_eh_inner(input.input.into(), strategy)
}

///
pub fn get_session_from_eh_inner(session_eh: EntryHash, strategy: GetStrategy) -> ExternResult<Option<PlacementSession>> {
  let maybe_record = get(session_eh, strategy_to_options(strategy))?;
  let Some(record) = maybe_record else {
    return Ok(None);
  };
  let session = get_typed_from_record::<PlacementSession>(record)?;
  Ok(Some(session))
}


///
pub fn is_valid_space(space_eh: EntryHash, strategy: GetStrategy) -> ExternResult<()> {
  let _entry_type = get_entry_type_at(space_eh.into(), strategy)?;
  // FIXME issue in HDK: cant add playset_integrity_zome because of link issue
  // if entry_type != playset_integrity::PlaysetTypes::Space.try_into().unwrap() {
  //   return zome_error!("input.space_eh does not point to a space entry");
  // }
  Ok(())
}

/// Used by write paths: look locally first, then ask the network
pub fn is_valid_space_local_or_network(space_eh: EntryHash) -> ExternResult<()> {
  if is_valid_space(space_eh.clone(), GetStrategy::Local).is_ok() {
    return Ok(());
  }
  is_valid_space(space_eh, GetStrategy::Network)
}


///
#[hdk_extern]
pub fn get_space_sessions(input: ZomeFnInput<EntryHashB64>) -> ExternResult<Vec<EntryHashB64>> {
  let strategy = input.get_strategy();
  let space_eh: EntryHash = input.input.into();
  /// Make sure its a space
  is_valid_space(space_eh.clone(), strategy)?;
  // get links
  let links = get_links(LinkQuery::try_new(space_eh, WhereLinkType::All)?, strategy)?;
  let sessions = links.into_iter()
    .filter_map(|link| link.target.into_entry_hash())
    .map(|eh| eh.into())
    .collect();
  Ok(sessions)
}



#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SpaceSessionsInput {
  session_names: Vec<String>,
  space_eh: EntryHashB64,
}

#[hdk_extern]
fn create_sessions(input: SpaceSessionsInput) -> ExternResult<Vec<EntryHashB64>> {
  let space_eh: EntryHash = input.space_eh.into();
  /// Make sure its a space
  is_valid_space_local_or_network(space_eh.clone())?;
  /// Create each session
  let mut index = 0;
  let mut ehs = Vec::new();
  for name in input.session_names {
    let eh = create_session(space_eh.clone(), name, index)?;
    ehs.push(eh);
    index += 1;
  }
  Ok(ehs)
}


/// Argument is a Space so we are sure the hh is valid
pub fn create_session(space_eh: EntryHash, name: String, index: u32) -> ExternResult<EntryHashB64> {
  let session = PlacementSession { name, index, space_eh: space_eh.clone().into() };
  let session_eh = hash_entry(session.clone())?;
  let _hh = create_entry(WhereEntry::PlacementSession(session.clone()))?;
  let tag = format!("{}", index).as_bytes().to_vec();
  create_link(space_eh.clone(), session_eh.clone(), WhereLinkType::All, tag)?;
  let eh64: EntryHashB64 = session_eh.clone().into();
  Ok(eh64)
}


/// Returns 0 if no session found or if space does not exist
pub fn get_next_session_index(space_eh: EntryHash) -> ExternResult<u32> {
  let pairs = get_typed_from_links::<PlacementSession>(LinkQuery::try_new(space_eh, WhereLinkType::All)?, GetStrategy::Local)?;
  let mut top = 0;
  for pair in pairs {
    let session: PlacementSession = pair.0;
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
fn create_next_session(input: CreateNextSessionInput) -> ExternResult<(EntryHashB64, u32)> {
  let space_eh: EntryHash = input.space_eh.into();
  is_valid_space_local_or_network(space_eh.clone())?;
  let next_index = get_next_session_index(space_eh.clone())?;
  let eh = create_session(space_eh, input.name, next_index)?;
  Ok((eh, next_index))
}
