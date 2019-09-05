import { ASUtil, ImportsObject, instantiateStreaming } from 'assemblyscript/lib/loader'

interface Contract extends ASUtil {
  call(): void,
  deploy(): void,
  memory: WebAssembly.Memory
}

interface Env extends ImportsObject {
  console?: {
    console_log: (pointer: number, length: number) => void
  }
  env?: {
    memory?: WebAssembly.Memory,
    trace?: (msg: number, numArgs?: number, ...args: any[]) => void,
    ext_get_storage?: (key_ptr: number) => number,
    ext_scratch_read?: (dest_ptr: number, offset: number, len: number) => void,
    ext_scratch_size?: () => number,
    ext_scratch_write?: (src_ptr: number, len: number) => void,
    ext_set_rent_allowance?: (value_ptr: number, value_len: number) => void,
    ext_set_storage?: (key_ptr: number, value_non_null: number, value_ptr: number, value_len: number) => void
  }
}

const memory = new WebAssembly.Memory({
  initial: 2,
  maximum: 16,
});
let scratchBuf: Uint8Array = new Uint8Array(0);

const env: Env = {
  console: {
    console_log: function (pointer: number) {
      console.log('console_log', pointer )
      // const view = new Uint8Array(memory.buffer);
      // // `subarray` uses the same underlying ArrayBuffer as the view
      // const subarr = view.subarray(pointer, pointer + length);
      // const buf = new Uint8Array(subarr);
      // const str = (new TextDecoder()).decode(buf); // (utf-8 by default)
    }
  },
  env: {
    memory: memory,
    ext_get_storage: function (key_ptr: number) {
      console.log('ext_get_storage', key_ptr )
      return key_ptr;
    },
    ext_scratch_read: function(dest_ptr: number, offset: number, len: number) {
      console.log(`ext_scratch_read(dest_ptr=${dest_ptr}, offset=${offset}, len="${len})`);
      let mem = new Uint8Array(memory.buffer);
      for (let i = 0; i < len; i++) {
          mem[dest_ptr + i] = scratchBuf[i];
      }
    },
    ext_scratch_size: function () {
      console.log('ext_scratch_size', scratchBuf.length )
      return scratchBuf.length;
    },
    ext_scratch_write: function (src_ptr: number, len: number) {
      console.log('ext_scratch_write', src_ptr, len )
      var mem = new Uint8Array(memory.buffer);
      console.log('ext_scratch_write mem.values', mem.values)
      // for (let i = 0; i < len; i++) {
      //     scratchBuf.push(mem[ptr + i]);
      // }
      return scratchBuf.length;
    },
    ext_set_rent_allowance: function (value_ptr: number, value_len: number) {
      console.log('ext_return', value_ptr, value_len)
    },
    ext_set_storage: function (key_ptr: number, value_non_null: number, value_ptr: number, value_len: number) {
      console.log('ext_set_storage', key_ptr, value_non_null, value_ptr, value_len)
    }
  }
};

async function main() {
  const module = await instantiateStreaming(fetch('./build/untouched.wasm'), env as Env) as Contract;

  // console.log('   say :' , module.getString(module.say(module.newString("oi"))))

  console.log("instantiated", module);
    
  scratchBuf = new Uint8Array([
    42, 0, 0, 0,
    1, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 5, 0, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1
  ]);
  const test = module.call()
  console.log('test', test)
};

main();