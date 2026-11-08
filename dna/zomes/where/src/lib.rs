#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

/** Essential zome fns every @ddd-qc/lit-happ DVM calls on init (get_zome_info, get_dna_info, ...) */
extern crate zome_core;
pub use zome_core::*;

use hdk::prelude::*;

pub mod signals;
pub mod here;
pub mod placement_session;
pub mod hide;

pub use zome_fn_input::*;

pub const PLAYSET_DEFAULT_COORDINATOR_ZOME_NAME: &'static str = "zPlayset";


#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    /// grant unrestricted access to recv_remote_signal so other agents can send us signals
    let mut functions = HashSet::new();
    functions.insert((zome_info()?.name, FunctionName("recv_remote_signal".into())));
    create_cap_grant(CapGrant::new_zome_call_grant(
        "recv_remote_signal".into(),
        GrantConstraint::Unrestricted,
        GrantedFunctions::Listed(functions),
    ))?;
    Ok(InitCallbackResult::Pass)
}


/// Helper function for calling the playset zome via inter-zome call
pub fn call_playset_zome<T>(fn_name: &str, payload: T) -> ExternResult<ZomeCallResponse>
    where
        T: serde::Serialize + std::fmt::Debug,
{
    call(
        CallTargetCell::Local,
        PLAYSET_DEFAULT_COORDINATOR_ZOME_NAME,
        fn_name.to_string().into(),
        None,
        payload,
    )
}
