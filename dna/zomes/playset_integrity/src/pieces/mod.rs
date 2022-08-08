mod template;
mod emoji_group;
mod svg_marker;
mod space;

pub use template::*;
pub use emoji_group::*;
pub use svg_marker::*;
pub use space::*;


//--------------------------------------------------------------------------------------------------

use hdi::prelude::*;
use holo_hash::EntryHashB64;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum MarkerPiece {
  Svg(EntryHashB64),
  EmojiGroup(EntryHashB64),
}

impl MarkerPiece {
  pub fn type_name(&self) -> &str {
    match self {
      MarkerPiece::Svg(_) => "SvgMarker",
      MarkerPiece::EmojiGroup(_) => "EmojiGroup",
    }
  }

  pub fn eh(&self) -> EntryHash {
    match self {
      MarkerPiece::Svg(eh) => eh.to_owned().into(),
      MarkerPiece::EmojiGroup(eh) => eh.to_owned().into(),
    }
  }

}
