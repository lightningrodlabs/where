import { randomHash } from 'holochain-ui-test-utils';

// TODO: change the functions of this class to match the functions that your zome has
export class WhereMock {
  constructor() {
    this.spaces = {};
  }

  createSpace(spaceInput) {
    const newId = randomHash();
    this.spaces.push([
      newId,
      {
        ...spaceInput,
        created_by: randomHash(),
      },
    ]);

    return newId;
  }

  getSpaces() {
    return this.spaces;
  }
}
