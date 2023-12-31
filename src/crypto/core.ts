import { ssrSafeWindow } from '../ssr';
import CryptoJS from 'crypto-js';


export interface Cypher {
  readonly key: string;
  readonly name: string;
  encrypt(data: string): Promise<string>;
  decrypt<T>(data: string): Promise<T>;
}

export type CypherAlgorithm = 'aes-256-cbc' | 'secp521r1' | 'secp512k1';


export interface CryptoService {
  uuid(): string;
  nonce(byteLength?: number): Promise<string>;
  pbkdf2(thing: string, key: string): Promise<string>;
  hmac512(data: string, key: string): Promise<string>;
  randomBytes(length: number): Promise<Uint8Array>;
}


export class Crypto {

  /**
   * Generate a random nonce
   * 
   * @param {number} [byteLength= 32] 
   * @returns {Promise<string>}
   */
  public static async nonce(byteLength: number = 32): Promise<string> {
    let arr: Uint8Array;

    if(ssrSafeWindow) {
      arr = ssrSafeWindow.crypto.getRandomValues(new Uint8Array(byteLength));
    } else {
      const __crypto = await import('crypto');
      arr = new Uint8Array(__crypto.randomBytes(byteLength));
    }

    return Array.prototype.map.call(arr, function(byte) {
      return ('0' + byte.toString(16)).slice(-2);
    }).join('');
  }

  /**
   * Returns an Uint8Array filled with random bytes
   * 
   * @param {number} [length] 
   * @returns {Promise<Uint8Array>}
   */
  public static async randomBytes(length: number): Promise<Uint8Array> {
    if(ssrSafeWindow) return ssrSafeWindow.crypto.getRandomValues(new Uint8Array(length));

    const __crypto = await import('crypto');
    return new Uint8Array(__crypto.randomBytes(length));
  }

  /**
   * Generate a random UUID
   * 
   * @returns {string}
   */
  public static uuid(): string {
    let d = new Date().getTime();

    if(typeof performance !== 'undefined' && typeof performance.now === 'function') {
      d += performance.now(); // use high-precision timer if available
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /**
   * Provides an asynchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation
   * 
   * @param {string} thing 
   * @param {string} key 
   * @returns 
   */
  public static async pbkdf2(thing: string, key: string): Promise<string> {
    if(ssrSafeWindow) return CryptoJS.PBKDF2(thing, key, {
      iterations: 100000,
      keySize: 64,
      hasher: CryptoJS.algo.SHA512,
    }).toString(CryptoJS.enc.Hex);

    const __crypto = await import('crypto');

    return new Promise((resolve, reject) => {
      __crypto.pbkdf2(
        thing,
        key,
        100000,
        64,
        'sha512',
        (err, buffer) => {
          if(err) return reject(err);
          resolve(buffer.toString('hex'));
        } // eslint-disable-line comma-dangle
      );
    });
  }

  public static async hmac512(data: string, key: string): Promise<string> {
    if(ssrSafeWindow) return CryptoJS.HmacSHA512(data, key).toString(CryptoJS.enc.Hex);
    
    const __crypto = await import('crypto');
    const hmac = __crypto.createHmac('sha512', key);
    hmac.update(data);
    return hmac.digest('hex');
  }
}


export const Utf8 = Object.freeze({
  parse: function (data: string): CryptoJS.lib.WordArray {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    return CryptoJS.enc.Utf8.parse(data);
  },
  stringify: function<T = string>(data: CryptoJS.lib.WordArray, json: boolean = false): T {
    const _returned = CryptoJS.enc.Utf8.stringify(data);
    return json ? JSON.parse(_returned) : _returned;
  },
});


export const Base64 = Object.freeze({
  encode: (data: string): string => CryptoJS.enc.Base64.stringify(Utf8.parse(data)),
  decode: (data: string): string => Utf8.stringify(CryptoJS.enc.Base64.parse(data), false),
});
