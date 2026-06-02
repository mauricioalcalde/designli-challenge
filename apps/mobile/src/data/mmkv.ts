import * as MMKVLib from 'react-native-mmkv';

export function createStorage() {
  if (typeof MMKVLib.createMMKV === 'function') {
    return MMKVLib.createMMKV();
  }

  if (typeof MMKVLib.MMKV === 'function') {
    return new MMKVLib.MMKV();
  }

  throw new Error('react-native-mmkv storage API is unavailable');
}
