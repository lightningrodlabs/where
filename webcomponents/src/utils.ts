/** */
import {CellId, HoloHashB64} from "@holochain/client";

export interface HoloHashedB64<T> {
  hash: HoloHashB64;
  content: T;
}


// export function areArraysEqual(first: Uint8Array, second: Uint8Array) {
//   return first.length === second.length && first.every((value, index) => value === second[index])
// }
//
// export function areCellsEqual(cellA: CellId, cellB: CellId) {
//   return areArraysEqual(cellA[0], cellB[0]) && areArraysEqual(cellA[1], cellB[1])
// }


/**
 *
 * @param key
 * @param value
 */
export function mapReplacer(key:any, value:any) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

export function mapReviver(key:any, value:any) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}


/** `local` flag for a `ZomeFnInput` from a GetStrategy */
import {GetStrategy} from "@holochain-open-dev/core-types";
import {Profile as ProfileMat} from "@ddd-qc/profiles-dvm";

/** Resolve a zome call to [undefined, data], or to [error] when cell-proxy throttled it
 *  (same identical call within its 200ms bucket). Any other failure still throws. */
export function catchThrottled<T>(promise: Promise<T>): Promise<[undefined, T] | [Error]> {
  return promise
    .then((data) => [undefined, data] as [undefined, T])
    .catch((error) => {
      if (error && error.throttled) {
        return [error] as [Error];
      }
      throw error;
    });
}

/** Placeholder used while this agent's profile is not in the perspective yet */
export const UNKNOWN_PROFILE: ProfileMat = {nickname: "unknown", fields: {lang: "en"}};
export function isLocal(strategy: GetStrategy): boolean {
  return strategy == GetStrategy.Local;
}
