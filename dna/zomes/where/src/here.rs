use hdk::prelude::*;
use holo_hash::{EntryHashB64, AgentPubKeyB64, ActionHashB64};
use std::collections::BTreeMap;
use zome_utils::*;

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
    //debug!("add_here(): {:?}", input);
    /// Find session
    let get_input = GetSessionInput {space_eh: input.space_eh.into(), index: input.session_index};
    let maybe_session_eh = get_session(get_input)?;
    let Some(session_eh) =  maybe_session_eh
        else {return zome_error!("Session not found")};
    let session_eh64: EntryHashB64 = session_eh.into();
    /// Create and link 'Here'
    let here = Here {value: input.value, session_eh: session_eh64.clone(), meta: input.meta};
    let here_eh = hash_entry(here.clone())?;
    create_entry(WhereEntry::Here(here.clone()))?;
    let link_ah = create_link(session_eh64, here_eh, WhereLinkType::All, LinkTag::from(()))?;
    Ok(link_ah.into())
}

#[hdk_extern]
fn update_here(input: UpdateHereInput) -> ExternResult<ActionHashB64> {
    delete_here(input.old_here_ah)?;
    add_here(input.new_here)
}

#[hdk_extern]
fn delete_here(link_ah: ActionHashB64) -> ExternResult<()> {
    delete_link(link_ah.into())?;
    Ok(())
}

/// Input to the create channel call
#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct HereOutput {
    pub entry: Here,
    pub link_ah: ActionHashB64,
    pub author: AgentPubKeyB64,
}


// #[hdk_extern]
// fn get_heres2(spaceEh: EntryHashB64, sessionIndex: u32) -> ExternResult<Vec<HereOutput>> {
//     let heres = get_heres_inner(sessionEh.into())?;
//     Ok(heres)
// }


#[hdk_extern]
fn get_heres(session_eh: EntryHashB64) -> ExternResult<Vec<HereOutput>> {
    //debug!("get_heres() called: {:?}", session_eh);
    /// make sure its a session
    let _session = get_session_from_eh(session_eh.clone())?;
    /// Get links
    let heres = get_heres_inner(session_eh.into())?;
    //debug!("get_heres() result: {:?}", heres);
    Ok(heres)
}

///
fn get_heres_inner(base: EntryHash) -> ExternResult<Vec<HereOutput>> {
    let links = get_links(base, WhereLinkType::All, None)?;
    let mut output = Vec::with_capacity(links.len());
    /// Get details of every link on the target and create the message.
    for link in links.into_iter().map(|link| link) {
        //debug!("get_heres_inner() link: {:?}", link);
        let here_eh = link.target.clone().into_entry_hash().unwrap();
        let details =  get_details(here_eh, GetOptions::content())?;
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
