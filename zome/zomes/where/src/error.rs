use hdk::prelude::*;
use std::convert::Infallible;
use hc_utils::UtilsError;

#[derive(thiserror::Error, Debug)]
pub enum WhereError {
    #[error(transparent)]
    Serialization(#[from] SerializedBytesError),
    #[error(transparent)]
    Infallible(#[from] Infallible),
    #[error(transparent)]
    EntryError(#[from] EntryError),
    #[error("Failed to convert an agent link tag to an agent pub key")]
    AgentTag,
    #[error(transparent)]
    Wasm(#[from] WasmError),
    #[error(transparent)]
    Timestamp(#[from] TimestampError),
    #[error(transparent)]
    UtilsError(#[from] UtilsError),
}

pub type WhereResult<T> = Result<T, WhereError>;

impl From<WhereError> for WasmError {
    fn from(c: WhereError) -> Self {
        WasmError::Guest(c.to_string())
    }
}
