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
    /*background-color: #fafafa;*/
  }
  sl-avatar::part(base) {
    background-color: transparent;
  }
  sl-avatar::part(initials) {
    /*line-height: 31px;*/
    font-size: 26px;
    margin-top: -3px;
  }
  .unicode-button {
    --mdc-icon-button-size: ${EMOJI_WIDTH}px;
    --mdc-icon-size: ${EMOJI_WIDTH}px;
  }
  .unicodes-container {
    border: 1px solid grey;
    padding: 5px;
    min-height: ${EMOJI_WIDTH}px;
  }
`;
