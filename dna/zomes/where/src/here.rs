use hdk::prelude::*;
use hc_utils::get_latest_entry;
use holo_hash::{EntryHashB64, AgentPubKeyB64, HeaderHashB64};
use std::collections::BTreeMap;

use crate::{
    error::*,
    placement_session::*,
};

/// Here entry definition
#[hdk_entry(id = "Here")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Here {
    value: String, // a location in some arbitrary space (Json encoded)
    session_eh: EntryHashB64,
    meta: BTreeMap<String, String>, // contextualized meaning of the value
}


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
    old_here_hh: HeaderHashB64,
    new_here: AddHereInput,
}

#[hdk_extern]
fn add_here(input: AddHereInput) -> ExternResult<HeaderHashB64> {
    // Find session
    let get_input = GetSessionInput {space_eh: input.space_eh.into(), index: input.session_index};
    let maybe_session_eh = get_session(get_input)?;
    let session_eh64: EntryHashB64 = match maybe_session_eh {
        Some(eh) => eh.into(),
        None => return error("Session not found"),
    };
    // Create and link 'Here'
    let here = Here {value: input.value, session_eh: session_eh64.clone(), meta: input.meta};
    let here_eh = hash_entry(here.clone())?;
    create_entry(here.clone())?;
    let link_hh = create_link(session_eh64.into(), here_eh, ())?;
    Ok(link_hh.into())
}

#[hdk_extern]
fn update_here(input: UpdateHereInput) -> ExternResult<HeaderHashB64> {
    delete_here(input.old_here_hh)?;
    add_here(input.new_here)
}

#[hdk_extern]
fn delete_here(link_hh: HeaderHashB64) -> ExternResult<()> {
    delete_link(link_hh.into())?;
    Ok(())
}

/// Input to the create channel call
#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct HereOutput {
    pub entry: Here,
    pub link_hh: HeaderHashB64,
    pub author: AgentPubKeyB64,
}


// #[hdk_extern]
// fn get_heres2(spaceEh: EntryHashB64, sessionIndex: u32) -> ExternResult<Vec<HereOutput>> {
//     let heres = get_heres_inner(sessionEh.into())?;
//     Ok(heres)
// }


#[hdk_extern]
fn get_heres(session_eh: EntryHashB64) -> ExternResult<Vec<HereOutput>> {
    debug!("get_heres() called: {:?}", session_eh);
    // make sure its a session
    match get_latest_entry(session_eh.clone().into(), Default::default()) {
        Ok(entry) => match PlacementSession::try_from(entry.clone()) {
            Ok(_e) => {},
            Err(_) => return error("get_heres(): No PlacementSession found at given EntryHash"),
        },
        _ => return error("get_heres(): No entry found at given EntryHash"),
    }
    // Get links
    let heres = get_heres_inner(session_eh.into())?;
    debug!("get_heres() result: {:?}", heres);
    Ok(heres)
}

fn get_heres_inner(base: EntryHash) -> WhereResult<Vec<HereOutput>> {
    let links = get_links(base.into(), None)?;
    let mut output = Vec::with_capacity(links.len());
    // for every link get details on the target and create the message
    for link in links.into_iter().map(|link| link) {
        debug!("get_heres_inner() link: {:?}", link);
        let w = match get_details(link.target, GetOptions::content())? {
            Some(Details::Entry(EntryDetails {
                entry, mut headers, ..
            })) => {
                // Turn the entry into a HereOutput
                let entry: Here = entry.try_into()?;
                let signed_header = match headers.pop() {
                    Some(h) => h,
                    // Ignoring missing messages
                    None => continue,
                };

                // Create the output for the UI
                HereOutput {
                    entry,
                    link_hh: link.create_link_hash.into(),
                    author: signed_header.header().author().clone().into()
                }
            }
            // Here is missing. This could be an error but we are
            // going to ignore it.
            _ => continue,
        };
        output.push(w);
    }
    Ok(output)
}
