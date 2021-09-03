pub use hdk::prelude::*;
pub use hdk::prelude::Path;
pub use error::{WhereError, WhereResult};
pub mod error;
use hc_utils::*;
use std::collections::HashMap;
use holo_hash::{EntryHashB64, AgentPubKeyB64};

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut functions = BTreeSet::new();
    functions.insert((zome_info()?.zome_name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;
    Ok(InitCallbackResult::Pass)
}

entry_defs![
    Path::entry_def(),
    Space::entry_def(),
    Where::entry_def()
];

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SpaceOutput {
    hash: EntryHashB64,
    content: Space,
}

/// A space
#[hdk_entry(id = "space")]
#[derive(Clone)]
pub struct Space {
    pub name: String,
    //pub dimensionality: CoordinateSystem,
    pub surface: String,
    pub meta: HashMap<String, String>,  // usable by the UI for whatever
}

#[hdk_entry(id = "where")]
#[derive(Clone)]
pub struct Where {
    location: String, // a location in a some arbitrary space (Json encoded)
    meta: HashMap<String, String>, // contextualized meaning of the location
}

fn get_spaces_path() -> Path {
    Path::from("spaces")
}

#[hdk_extern]
fn create_space(input: Space) -> ExternResult<EntryHashB64> {
    let _header_hash = create_entry(&input)?;
    let hash = hash_entry(input)?;
    let path = get_spaces_path();
    path.ensure()?;
    let anchor_hash = path.hash()?;
    create_link(anchor_hash, hash.clone(), ())?;
    Ok(hash.into())
}

#[hdk_extern]
fn get_spaces(_: ()) -> ExternResult<Vec<SpaceOutput>> {
    let path = get_spaces_path();
    let spaces = get_spaces_inner(path.hash()?)?;
    Ok(spaces)
}

fn get_spaces_inner(base: EntryHash) -> WhereResult<Vec<SpaceOutput>> {
    let entries = get_links_and_load_type(base, None)?;
    let mut spaces = vec![];
    for e in entries {
        spaces.push(SpaceOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(spaces)
}

/// Input to the create channel call
#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
pub struct WhereInput {
    pub space: EntryHash,
    pub entry: Where,
}

#[hdk_extern]
fn add_where(input: WhereInput) -> ExternResult<EntryHash> {
    let _header_hash = create_entry(&input.entry)?;
    let hash = hash_entry(input.entry)?;
    create_link(input.space, hash.clone(), ())?;
    Ok(hash)
}

/// Input to the create channel call
#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
pub struct WhereOutput {
    pub entry: Where,
    pub author: AgentPubKeyB64,
}

#[hdk_extern]
fn get_wheres(input: EntryHash) -> ExternResult<Vec<WhereOutput>> {
    let wheres = get_wheres_inner(input)?;
    Ok(wheres)
}

fn get_wheres_inner(base: EntryHash) -> WhereResult<Vec<WhereOutput>> {
    let links = get_links(base.into(), None)?.into_inner();

    let mut output = Vec::with_capacity(links.len());

    // for every link get details on the target and create the message
    for target in links.into_iter().map(|link| link.target) {
        let w = match get_details(target, GetOptions::content())? {
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

                // Create the message type for the UI
                WhereOutput{
                    entry,
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
