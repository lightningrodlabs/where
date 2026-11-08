use hdk::prelude::*;
use zome_fn_input::*;

use where_integrity::*;

///
#[hdk_extern]
fn hide_space(space_eh64: EntryHashB64) -> ExternResult<ActionHash> {
  let my_agent_eh = EntryHash::from(agent_info()?.agent_initial_pubkey);
  let space_eh: EntryHash = space_eh64.into();
  return create_link(my_agent_eh, space_eh, WhereLinkType::Hide, LinkTag::from(()));
}

///
#[hdk_extern]
fn unhide_space(space_eh64: EntryHashB64) -> ExternResult<()> {
  let space_eh: EntryHash = space_eh64.into();
  let my_agent_eh = EntryHash::from(agent_info()?.agent_initial_pubkey);
  /// Hide links are authored by this agent, so they are always local
  let links = get_links(LinkQuery::try_new(my_agent_eh, WhereLinkType::Hide)?, GetStrategy::Local)?;
  for link in links.iter() {
    if link.target.clone().into_entry_hash() == Some(space_eh.clone()) {
      let _hash = delete_link(link.create_link_hash.clone(), GetOptions::local())?;
      return Ok(());
    }
  }
  Ok(())
}

///
#[hdk_extern]
fn get_hidden_spaces(input: ZomeFnInput<()>) -> ExternResult<Vec<EntryHashB64>> {
  let my_agent_eh = EntryHash::from(agent_info()?.agent_initial_pubkey);
  let links = get_links(LinkQuery::try_new(my_agent_eh, WhereLinkType::Hide)?, input.get_strategy())?;
  let spaces = links.into_iter()
    .filter_map(|link| link.target.into_entry_hash())
    .map(|eh| eh.into())
    .collect();
  Ok(spaces)
}
