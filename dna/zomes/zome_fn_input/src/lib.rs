//! Shared wrapper for zome-call inputs that lets the caller pick the
//! `GetStrategy` of every read done by the call (`local`, default `true`).
//! Same shape as the `ZomeFnInput` used in presence.

use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ZomeFnInput<T> {
    pub input: T,
    /// `true` (default): read only what this conductor already holds.
    /// `false`: go to the network.
    pub local: Option<bool>,
}

impl<T> ZomeFnInput<T> {
    pub fn new(input: T, local: Option<bool>) -> Self {
        Self { input, local }
    }

    pub fn is_local(&self) -> bool {
        self.local.unwrap_or(true)
    }

    pub fn get_strategy(&self) -> GetStrategy {
        match self.is_local() {
            true => GetStrategy::Local,
            false => GetStrategy::Network,
        }
    }

    pub fn get_options(&self) -> GetOptions {
        strategy_to_options(self.get_strategy())
    }
}

/// `GetOptions` matching a `GetStrategy`
pub fn strategy_to_options(strategy: GetStrategy) -> GetOptions {
    match strategy {
        GetStrategy::Local => GetOptions::local(),
        _ => GetOptions::network(),
    }
}
