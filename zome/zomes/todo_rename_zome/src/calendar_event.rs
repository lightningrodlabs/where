use crate::err;
use chrono::{serde::ts_milliseconds, DateTime, Utc};
use hdk::prelude::*;
use holo_hash::{AgentPubKeyB64, EntryHashB64};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum EventLocation {
    Resource(EntryHashB64),
    Custom(String),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CalendarEventOutput {
    entry_hash: EntryHashB64,
    entry: CalendarEvent,
}

#[hdk_entry(id = "calendar_event", visibility = "public")]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct CalendarEvent {
    pub created_by: AgentPubKeyB64,
    pub title: String,

    #[serde(with = "ts_milliseconds")]
    pub start_time: DateTime<Utc>,
    #[serde(with = "ts_milliseconds")]
    pub end_time: DateTime<Utc>,

    pub location: Option<EventLocation>,
    pub invitees: Vec<AgentPubKeyB64>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateCalendarEventInput {
    pub title: String,
    #[serde(with = "ts_milliseconds")]
    pub start_time: DateTime<Utc>,
    #[serde(with = "ts_milliseconds")]
    pub end_time: DateTime<Utc>,
    pub location: Option<EventLocation>,
    pub invitees: Vec<AgentPubKeyB64>,
}
/**
 * Creates a new calendar event, linking from the creator and the invitees public key
 */
pub fn create_calendar_event(
    calendar_event_input: CreateCalendarEventInput,
) -> ExternResult<CalendarEventOutput> {
    let agent_info = agent_info()?;

    let calendar_event = CalendarEvent {
        created_by: AgentPubKeyB64::from(agent_info.agent_latest_pubkey.clone()),
        title: calendar_event_input.title,
        start_time: calendar_event_input.start_time,
        end_time: calendar_event_input.end_time,
        location: calendar_event_input.location,
        invitees: calendar_event_input.invitees,
    };

    create_entry(&calendar_event)?;

    let calendar_event_hash = hash_entry(&calendar_event)?;

    let path = calendar_events_path();

    path.ensure()?;

    create_link(path.hash()?, calendar_event_hash.clone(), ())?;

    Ok(CalendarEventOutput {
        entry_hash: EntryHashB64::from(calendar_event_hash),
        entry: calendar_event,
    })
}

/**
 * Returns the calendar in which the agent is the creator or is an invitee
 */
pub fn get_my_calendar_events() -> ExternResult<Vec<CalendarEventOutput>> {
    let path = calendar_events_path();

    let links = get_links(path.hash()?, None)?;

    let events = links
        .into_inner()
        .iter()
        .map(|link| {
            let element = get(link.target.clone(), GetOptions::default())?
                .ok_or(err("Could not get calendar event"))?;

            let calendar_event: CalendarEvent = element
                .entry()
                .to_app_option()?
                .ok_or(err("Could not get calendar event"))?;

            Ok(CalendarEventOutput {
                entry_hash: link.target.clone().into(),
                entry: calendar_event,
            })
        })
        .collect::<ExternResult<Vec<CalendarEventOutput>>>()?;

    Ok(events)
}

#[hdk_extern]
pub fn get_calendar_event(calendar_event_hash: EntryHashB64) -> ExternResult<CalendarEvent> {
    let element = get(EntryHash::from(calendar_event_hash), GetOptions::default())?
        .ok_or(err("Could not get calendar event"))?;

    let calendar_event: CalendarEvent = element
        .entry()
        .to_app_option()?
        .ok_or(err("Could not get calendar event"))?;

    Ok(calendar_event)
}

/** Private helpers **/

fn calendar_events_path() -> Path {
    Path::from(format!("calendar_events"))
}
