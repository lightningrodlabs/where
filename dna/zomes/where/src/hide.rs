use hdk::prelude::*;
use holo_hash::EntryHashB64;
use zome_utils::*;
use where_integrity::*;

///
#[hdk_extern]
fn hide_space(space_eh64: EntryHashB64) -> ExternResult<ActionHash> {
  let my_agent_eh = EntryHash::from(agent_info().unwrap().agent_latest_pubkey);
  return create_link(my_agent_eh, space_eh64, WhereLinkType::Hide, LinkTag::from(()));
}

///
#[hdk_extern]
fn unhide_space(space_eh64: EntryHashB64) -> ExternResult<()> {
  let space_eh: EntryHash = space_eh64.into();
  let my_agent_eh = EntryHash::from(agent_info().unwrap().agent_latest_pubkey);
  let links = get_links(link_input(my_agent_eh, WhereLinkType::Hide, None))?;
  for link in links.iter() {
    if link.target.clone().into_entry_hash().unwrap() == space_eh {
      let _hash = delete_link(link.create_link_hash.clone())?;
      return Ok(());
    }
  }
  Ok(())
}

///
#[hdk_extern]
fn get_hidden_spaces(_: ()) -> ExternResult<Vec<EntryHashB64>> {
  //let my_agent_eh = EntryHash::from(agent_info()?.agent_latest_pubkey);
  let links = get_links(link_input(agent_info()?.agent_latest_pubkey, WhereLinkType::Hide, None))?;
  let spaces = links.iter().map(|link| link.target.clone().into_entry_hash().unwrap().into()).collect();
  Ok(spaces)
}
