use hdk::prelude::*;

use holo_hash::{EntryHashB64, AgentPubKeyB64, HeaderHashB64};

use crate::template::*;
use crate::space::*;
use crate::here::*;
use crate::emoji_group::*;
use crate::svg_marker::SvgMarker;

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(tag = "type", content = "content")]
pub enum Message {
    // - Messages sent by UI -- //
    Ping(AgentPubKeyB64),
    Pong(AgentPubKeyB64),
    NewHere(HereOutput),
    DeleteHere(HeaderHashB64),
    // - Messages sent by DNA -- //
    NewSpace((EntryHashB64, Space)),
    NewTemplate((EntryHashB64, Template)),
    NewSvgMarker((EntryHashB64, SvgMarker)),
    NewEmojiGroup((EntryHashB64, EmojiGroup)),
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SignalPayload {
    maybe_space_hash: Option<EntryHashB64>, // used for filtering by space if applicable
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
    let sig: SignalPayload = signal.decode()?;
    debug!("Received signal {:?}", sig);
    Ok(emit_signal(&sig)?)
}

/// Input to the notify call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NotifyInput {
    pub folks: Vec<AgentPubKeyB64>,
    pub signal: SignalPayload,
}


#[hdk_extern]
fn notify(input: NotifyInput) -> ExternResult<()> {
    let mut folks : Vec<AgentPubKey> = vec![];
    for a in input.folks.clone() {
        folks.push(a.into())
    }
    debug!("Sending signal {:?} to {:?}", input.signal, input.folks);
    remote_signal(ExternIO::encode(input.signal)?,folks)?;
    Ok(())
}
