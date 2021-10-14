import { css } from 'lit';

export const sharedStyles = css`
  .column {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    flex-direction: row;
  }
  .letter-marker {
    font-size: 22px;
    margin-left: 5px;
  }
  .marker-bg {
    width: 100%;
    height: 100%;
    background-color: red;
  }
`;
