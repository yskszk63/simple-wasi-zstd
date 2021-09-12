import WASI from "https://deno.land/std@0.106.0/wasi/snapshot_preview1.ts";
// @deno-types="../libzstd.d.ts"
import { compile, ZstdExports } from "../libzstd.js";

const wasi = new WASI({});

const instance = await WebAssembly.instantiate(await compile(), {
    wasi_snapshot_preview1: wasi.exports,
});
const exports = instance.exports as ZstdExports;
const {memory, malloc, free, ZSTD_compress, ZSTD_decompress} = exports;

const input = "Hello, World!Hello, World!Hello, World!Hello, World!";
const len = input.length;
const ptr = malloc(len);
try {
    const buf = new Uint8Array(memory.buffer, ptr, len);
    new TextEncoder().encodeInto(input, buf);

    const dstlen = 8 * 1024;
    const dstptr = malloc(dstlen);
    try {
        const ret = ZSTD_compress(dstptr, dstlen, ptr, len, 0);

        const dstlen2 = 8 * 1024;
        const dstptr2 = malloc(dstlen);
        try {
            const ret2 = ZSTD_decompress(dstptr2, dstlen2, dstptr, ret);
            const answer = new Uint8Array(memory.buffer, dstptr2, ret2);
            if (new TextDecoder().decode(answer) !== input) {
                throw new Error("assertion failed.");
            }
        } finally {
            free(dstptr2);
        }
    } finally {
        free(dstptr);
    }

} finally {
    free(ptr);
}
console.log("all okay.");
