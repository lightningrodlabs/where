use hdk::prelude::*;
use holo_hash::EntryHashB64;

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

// ///
// #[hdk_extern]
// fn get_visible_spaces(_: ()) -> ExternResult<Vec<SpaceOutput>> {
//   let hiddens = get_hidden_spaces(())?;
//   let res = crate::call_playset_zome("get_spaces", ())?;
//   let mut visibles = decode_response(res)?;
//   visibles.retain(|space_out| !hiddens.contains(&space_out.hash));
//   Ok(visibles)
// }
