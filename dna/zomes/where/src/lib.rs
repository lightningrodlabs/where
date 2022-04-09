#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdk::prelude::*;

pub mod error;
pub mod signals;
pub mod here;
pub mod placement_session;
pub mod hide;
//pub mod play;

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut functions = BTreeSet::new();
    functions.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;
    Ok(InitCallbackResult::Pass)
}


entry_defs![
    PathEntry::entry_def(),
    //space::Space::entry_def(),
    here::Here::entry_def(),
    placement_session::PlacementSession::entry_def()
];

pub const PLAYSET_ZOME_NAME: &'static str = "where_playset";


/// Helper function for calling the delivery-zome via inter-zome call
pub fn call_playset_zome<T>(fn_name: &str, payload: T) -> ExternResult<ZomeCallResponse>
    where
      T: serde::Serialize + std::fmt::Debug,
{
    call(
        CallTargetCell::Local,
        PLAYSET_ZOME_NAME.into(),
        fn_name.to_string().into(),
        None,
        payload,
    )
}
