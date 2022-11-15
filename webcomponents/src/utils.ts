/** */
import {CellId} from "@holochain/client";

export function areArraysEqual(first: Uint8Array, second: Uint8Array) {
  return first.length === second.length && first.every((value, index) => value === second[index])
}

export function areCellsEqual(cellA: CellId, cellB: CellId) {
  return areArraysEqual(cellA[0], cellB[0]) && areArraysEqual(cellA[1], cellB[1])
}



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
