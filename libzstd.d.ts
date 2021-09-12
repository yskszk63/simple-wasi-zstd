export interface Zstd {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): void;
  ZSTD_compress(dst: number, dstCapacity: number, src: number, srcSize: number, compressionLevel: number): number;
  ZSTD_decompress(dst: number, dstCapacity: number, src: number, compressedSize: number): number;
}
export type ZstdExports = Zstd & WebAssembly.Exports;

/**
 * Get compiled WebAssembly Module.
 */
export function compile(): Promise<WebAssembly.Module>;
