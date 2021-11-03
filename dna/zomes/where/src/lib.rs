pub use hdk::prelude::*;
pub use hdk::prelude::Path;
pub use error::{WhereError, WhereResult};

pub mod error;
pub mod space;
pub mod signals;
pub mod here;
pub mod template;

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
    Path::entry_def(),
    template::Template::entry_def(),
    space::Space::entry_def(),
    here::Here::entry_def()
];

