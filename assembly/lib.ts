import { u128 } from "bignum";
import {
  ext_get_storage,
  ext_scratch_read,
  ext_scratch_size,
  ext_scratch_write,
  ext_set_rent_allowance,
  ext_set_storage
} from './env';

enum Storage {
  HAS_VALUE,
  NO_VALUE
}

export function toBytes<T>(num: T, le = true): Uint8Array {
  const arr = new Uint8Array(sizeof<T>());
  // accept only integers and booleans
  if (isInteger<T>()) {
    store<T>(arr.dataStart, le ? num : bswap(num));
    return arr;
  }
  assert(false);
  return arr;
}


export function setStorage(key: Uint8Array, value: Uint8Array): void {
  const pointer = value ? value.dataStart : 0;
  const length = value ? value.length : 0;
  const valueNonNull = value ? 1 : 0;

  ext_set_storage(key.dataStart, valueNonNull, pointer, length);
}

// check for length 32 bytes
export function getStorage(key: Uint8Array): Uint8Array {
  // request storage at key, will be written in the scratch buffer
  // If there is an entry at the given location then this function will return 0,
  // if not it will return 1 and clear the scratch buffer.

  const result: u32 = ext_get_storage(key.dataStart); // pointer to key 32 bytes in static WASM memory

  let value = new Uint8Array(0);

  // if value is found
  if (result === Storage.HAS_VALUE) {
    // // getting size of scratch buffer to allocate the buffer of corresponding size to fit the contents of the scratch buffer
    const size: u32 = ext_scratch_size();
    // if value is not null or not an empty array
    if (size >  0) {
      // create empty array (Vec in Rust)
      value = new Uint8Array(size);
      // call
      ext_scratch_read(value.dataStart, 0, size);
    }
  }
  return value;
}

export function getScratchBuffer(): Uint8Array {
  let value = new Uint8Array(0);
  // Returns the size of the scratch buffer.
  const size = ext_scratch_size();

  if (size > 0) {
      value = new Uint8Array(size);
      // copy data from scratch buffer
      ext_scratch_read(value.dataStart, 0, size);
  }
  return value;
}

export function setScratchBuffer(data: Uint8Array): void {
  ext_scratch_write(data.dataStart, data.length);
}

export function setRentAllowance(value: u128): void {
  const valueBuffer: Uint8Array = value.toUint8Array();
  ext_set_rent_allowance(valueBuffer.dataStart, valueBuffer.length);
}