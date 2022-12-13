use hdk::prelude::*;
use holo_hash::{EntryHashB64, AgentPubKeyB64, ActionHashB64};

use where_integrity::*;
use crate::here::*;


///
/// Messages sent by UI ONLY
///
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(tag = "type", content = "content")]
pub enum Message {
    Ping(AgentPubKeyB64),
    Pong(AgentPubKeyB64),
    NewHere(HereOutput),
    DeleteHere((EntryHashB64, ActionHashB64)), /// sessionEh, hereLinkHh
    UpdateHere((u32, ActionHashB64, Here)),    ///[index, newLinkAh, newHereEntry]}
    NewSession((EntryHashB64, PlacementSession)),
    /// - with entry hash of entries
    NewSpace(EntryHashB64),
    NewTemplate(EntryHashB64),
    NewSvgMarker(EntryHashB64),
    NewEmojiGroup(EntryHashB64),
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SignalPayload {
    maybe_space_hash: Option<EntryHashB64>, /// used for filtering by space if applicable
    from: AgentPubKeyB64,
    message: Message,
}

impl SignalPayload {
   pub fn new(maybe_space_hash: Option<EntryHashB64>, from: AgentPubKeyB64, message: Message) -> Self {
        SignalPayload {
            maybe_space_hash,
            from,
            message,
        }
    }
}

#[hdk_extern]
fn recv_remote_signal(signal: ExternIO) -> ExternResult<()> {
    let sig: SignalPayload = signal.decode().unwrap();
    debug!("Received signal {:?}", sig);
    Ok(emit_signal(&sig)?)
}

/// Input to the notify call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NotifyInput {
    pub signal: SignalPayload,
    pub peers: Vec<AgentPubKeyB64>,
}

///
#[hdk_extern]
fn notify_peers(input: NotifyInput) -> ExternResult<()> {
    let mut peers: Vec<AgentPubKey> = vec![];
    for a in input.peers.clone() {
        peers.push(a.into())
    }
    debug!("Sending signal {:?} to {:?}", input.signal, input.peers);
    remote_signal(ExternIO::encode(input.signal).unwrap(), peers)?;
    Ok(())
}
