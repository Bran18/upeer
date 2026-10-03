import type { SwapToken } from '@pollar/core';

export type SwapAssetRef =
  | { type: 'native' }
  | { type: 'credit_alphanum4'; code: string; issuer: string }
  | { type: 'credit_alphanum12'; code: string; issuer: string };

export function assetRefId(asset: SwapAssetRef): string {
  if (asset.type === 'native') {
    return 'native';
  }
  return `${asset.code}:${asset.issuer}`;
}

export function assetRefLabel(asset: SwapAssetRef): string {
  if (asset.type === 'native') {
    return 'XLM (native)';
  }
  return asset.code;
}

export function balanceRowToAssetRef(record: {
  type?: string;
  code: string;
  issuer?: string;
}): SwapAssetRef {
  if (record.type === 'native' || record.code === 'XLM') {
    return { type: 'native' };
  }
  const type =
    record.type === 'credit_alphanum12' ? 'credit_alphanum12' : 'credit_alphanum4';
  return {
    type,
    code: record.code,
    issuer: record.issuer ?? '',
  };
}

export function swapTokenToAssetRef(token: SwapToken): SwapAssetRef {
  if (token.code.length <= 4) {
    return {
      type: 'credit_alphanum4',
      code: token.code,
      issuer: token.issuer,
    };
  }
  return {
    type: 'credit_alphanum12',
    code: token.code,
    issuer: token.issuer,
  };
}

export const NATIVE_XLM: SwapAssetRef = { type: 'native' };
