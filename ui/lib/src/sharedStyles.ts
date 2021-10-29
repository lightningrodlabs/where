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
    --size: ${MARKER_WIDTH}px;
    border-radius: 100%;
    border: black 1px solid;
    background-color: #fafafa;
  }
  sl-avatar::part(initials) {
    /*line-height: 31px;*/
    font-size: 26px;
    margin-top: -3px;
  }
`;
