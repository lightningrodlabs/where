import { css } from 'lit';
import {EMOJI_WIDTH, MARKER_WIDTH} from "./sharedRender";

export const sharedStyles = css`
  .column {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    flex-direction: row;
  }
  .emoji-marker::part(base) {
    background-color: #fafafa;
    font-size: ${EMOJI_WIDTH}px;
  }
  .initials-marker::part(base) {
    background-color: #fafafa;
    color: black;
  }
  sl-avatar {
    border-radius: 100%;
    border: black 1px solid;
    background-color: #fafafa;
  }
`;
