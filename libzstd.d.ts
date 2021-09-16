/**
 * ZSTD_reset_session_only = 1,
 * ZSTD_reset_parameters = 2,
 * ZSTD_reset_session_and_parameters = 3
 */
export type ZSTD_ResetDirective = 1 | 2 | 3;

/*
 * ZSTD_e_continue=0,
 * ZSTD_e_flush=1,
 * ZSTD_e_end=2
 */
export type ZSTD_EndDirective = 0 | 1 | 2;

export interface Zstd {
  memory: WebAssembly.Memory;

  malloc(size: number): number;
  free(ptr: number): void;

  ZSTD_isError(code: number): number;
  ZSTD_getErrorName(code: number): number;
  ZSTD_CStreamInSize(): number;
  ZSTD_CStreamOutSize(): number;

  ZSTD_compress(dst: number, dstCapacity: number, src: number, srcSize: number, compressionLevel: number): number;
  ZSTD_decompress(dst: number, dstCapacity: number, src: number, compressedSize: number): number;
  ZSTD_getFrameContentSize(src: number, srcSize: number): BigInt;

  ZSTD_createCCtx(): number;
  ZSTD_freeCCtx(cctx: number): number;
  ZSTD_CCtx_setParameter(cctx: number, param: number, value: number): number;
  ZSTD_CCtx_setPledgedSrcSize(cctx: number, pledgedSrcSize: BigInt): number;
  ZSTD_CCtx_reset(cctx: number, reset: ZSTD_ResetDirective): number;
  ZSTD_compressStream2_simpleArgs(cctx: number, dst: number, dstCapacity: number, dstPos: number, src: number, srcSize: number, srcPost: number, endOp: ZSTD_EndDirective): number;

  ZSTD_createDCtx(): number;
  ZSTD_freeDCtx(dctx: number): number;
  ZSTD_DCtx_setParameter(dctx: number, param: number, value: number): number;
  ZSTD_DCtx_reset(dctx: number, reset: ZSTD_ResetDirective): number;
  ZSTD_decompressStream_simpleArgs(cctx: number, dst: number, dstCapacity: number, dstPos: number, src: number, srcSize: number, srcPost: number): number;
}
export type ZstdExports = Zstd & WebAssembly.Exports;

/**
 * Get compiled WebAssembly Module.
 */
export function compile(): Promise<WebAssembly.Module>;
