use hdk::prelude::*;

use std::collections::HashMap;
use holo_hash::{EntryHashB64, AgentPubKeyB64, HeaderHashB64};

use crate::error::*;

/// Where entry definition
#[hdk_entry(id = "where")]
#[derive(Clone)]
pub struct Where {
    location: String, // a location in a some arbitrary space (Json encoded)
    meta: HashMap<String, String>, // contextualized meaning of the location
}


/// Input to the create channel call
#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
pub struct WhereInput {
    pub space: EntryHashB64,
    pub entry: Where,
}

#[hdk_extern]
fn add_where(input: WhereInput) -> ExternResult<HeaderHashB64> {
    create_entry(&input.entry)?;
    let hash = hash_entry(input.entry)?;
    let header_hash = create_link(input.space.into(), hash, ())?;
    Ok(header_hash.into())
}

#[hdk_extern]
fn delete_where(input: HeaderHashB64) -> ExternResult<()> {
    delete_link(input.into())?;
    Ok(())
}

/// Input to the create channel call
#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
pub struct WhereOutput {
    pub entry: Where,
    pub hash: HeaderHashB64,
    pub author: AgentPubKeyB64,
}

#[hdk_extern]
fn get_wheres(space: EntryHashB64) -> ExternResult<Vec<WhereOutput>> {
    let wheres = get_wheres_inner(space.into())?;
    Ok(wheres)
}

fn get_wheres_inner(base: EntryHash) -> WhereResult<Vec<WhereOutput>> {
    let links = get_links(base.into(), None)?.into_inner();

    let mut output = Vec::with_capacity(links.len());

    // for every link get details on the target and create the message
    for link in links.into_iter().map(|link| link) {
        let w = match get_details(link.target, GetOptions::content())? {
            Some(Details::Entry(EntryDetails {
                entry, mut headers, ..
            })) => {
                // Turn the entry into a WhereOutput
                let entry: Where = entry.try_into()?;
                let signed_header = match headers.pop() {
                    Some(h) => h,
                    // Ignoring missing messages
                    None => continue,
                };

                // Create the output for the UI
                WhereOutput{
                    entry,
                    hash: link.create_link_hash.into(),
                    author: signed_header.header().author().clone().into()
                }
            }
            // Where is missing. This could be an error but we are
            // going to ignore it.
            _ => continue,
        };
        output.push(w);
    }

    Ok(output)
}
