use hdk::prelude::*;
use std::collections::BTreeMap;
use zome_utils::*;
use zome_fn_input::*;

use where_integrity::*;
use crate::{
    placement_session::*,
};


#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct AddHereInput {
    pub space_eh: EntryHashB64,
    pub session_index: u32,
    pub value: String,
    pub meta: BTreeMap<String, String>,
}

/// Input to update a Here
#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct UpdateHereInput {
    old_here_ah: ActionHashB64,
    new_here: AddHereInput,
}

#[hdk_extern]
fn add_here(input: AddHereInput) -> ExternResult<ActionHashB64> {
    /// Find session (local first, then network)
    let get_input = GetSessionInput {space_eh: input.space_eh.into(), index: input.session_index};
    let maybe_session_eh = get_session_local_or_network(get_input)?;
    let Some(session_eh64) = maybe_session_eh
        else {return zome_error!("Session not found")};
    let session_eh: EntryHash = session_eh64.clone().into();
    /// Create and link 'Here'
    let here = Here {value: input.value, session_eh: session_eh64, meta: input.meta};
    let here_eh = hash_entry(here.clone())?;
    create_entry(WhereEntry::Here(here.clone()))?;
    let link_ah = create_link(session_eh, here_eh, WhereLinkType::All, LinkTag::from(()))?;
    Ok(link_ah.into())
}

#[hdk_extern]
fn update_here(input: UpdateHereInput) -> ExternResult<ActionHashB64> {
    delete_here(input.old_here_ah)?;
    add_here(input.new_here)
}

#[hdk_extern]
fn delete_here(link_ah: ActionHashB64) -> ExternResult<()> {
    /// The link was created by this agent, so it is available locally
    delete_link(link_ah.into(), GetOptions::local())?;
    Ok(())
}

/// Output of get_heres
#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct HereOutput {
    pub entry: Here,
    pub link_ah: ActionHashB64,
    pub author: AgentPubKeyB64,
}


#[hdk_extern]
fn get_heres(input: ZomeFnInput<EntryHashB64>) -> ExternResult<Vec<HereOutput>> {
    let strategy = input.get_strategy();
    let session_eh: EntryHash = input.input.into();
    /// make sure its a session
    let _session = get_session_from_eh_inner(session_eh.clone(), strategy)?;
    /// Get links
    let heres = get_heres_inner(session_eh, strategy)?;
    Ok(heres)
}

///
fn get_heres_inner(base: EntryHash, strategy: GetStrategy) -> ExternResult<Vec<HereOutput>> {
    let links = get_links(LinkQuery::try_new(base, WhereLinkType::All)?, strategy)?;
    let options = strategy_to_options(strategy);
    let mut output = Vec::with_capacity(links.len());
    /// Get details of every link on the target and create the message.
    for link in links.into_iter() {
        let Some(here_eh) = link.target.clone().into_entry_hash()
            else {continue};
        let details = get_details(here_eh, options.clone())?;
        let Some(Details::Entry(EntryDetails {entry, mut actions, .. })) = details
            else {continue};
        /// Turn the entry into a HereOutput
        let entry: Here = entry.try_into()?;
        let Some(signed_action) = actions.pop()
            else {continue};
        /// Create the output for the UI
        let w = HereOutput {
            entry,
            link_ah: link.create_link_hash.into(),
            author: signed_action.action().author().clone().into()
        };
        output.push(w);
    }
    Ok(output)
}
