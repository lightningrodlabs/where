use hdk::prelude::*;

mod calendar_event;

use calendar_event::CalendarEventOutput;

pub fn err(reason: &str) -> WasmError {
    WasmError::Guest(String::from(reason))
}

entry_defs![
    Path::entry_def(),
    calendar_event::CalendarEvent::entry_def()
];

/** Calendar events **/

#[hdk_extern]
pub fn create_calendar_event(
    calendar_event_input: calendar_event::CreateCalendarEventInput,
) -> ExternResult<CalendarEventOutput> {
    calendar_event::create_calendar_event(calendar_event_input)
}

#[hdk_extern]
pub fn get_my_calendar_events(_: ()) -> ExternResult<Vec<CalendarEventOutput>> {
    let calendar_events = calendar_event::get_my_calendar_events()?;

    Ok(calendar_events)
}
