/**
 * Web Crypto API implementation of End-to-End Encryption (E2EE)
 * Uses ECDH (Curve P-256) for Key Agreement + AES-GCM (256-bit) for message encryption.
 * Safety numbers and visual Telegram-style verification emojis.
 */

const KEY_STORAGE_PREFIX = 'telecrypt_keys_';
const EMOJI_SET = [
  '🔒', '🔑', '🛡️', '⚡', '🌟', '🚀', '💎', '🔥',
  '🦅', '🐺', '🦊', '🦁', '🌊', '🌲', '🪐', '🎯',
  '🍒', '🍏', '🍕', '☕', '🎸', '🎨', '⛵', '🏰'
];

export interface StoredKeyPair {
  publicKeyJWK: JsonWebKey;
  privateKeyJWK: JsonWebKey;
}

// Generate an ECDH key pair for the device/user
export async function generateE2EEKeyPair(): Promise<StoredKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  const publicKeyJWK = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJWK = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return { publicKeyJWK, privateKeyJWK };
}

// Get or generate key pair for current user
export async function getOrCreateUserKeys(userId: string): Promise<StoredKeyPair> {
  const storageKey = `${KEY_STORAGE_PREFIX}${userId}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.publicKeyJWK && parsed.privateKeyJWK) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed parsing stored keys, generating new', e);
    }
  }

  const newKeys = await generateE2EEKeyPair();
  localStorage.setItem(storageKey, JSON.stringify(newKeys));
  return newKeys;
}

// Save imported keys (e.g. from cross-device recovery phrase)
export function saveUserKeys(userId: string, keys: StoredKeyPair): void {
  const storageKey = `${KEY_STORAGE_PREFIX}${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(keys));
}

// Convert CryptoKey to and from JWK
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

// Derive a shared AES-GCM 256-bit encryption key from my private key + their public key
export async function deriveSharedKey(
  myPrivateKeyJWK: JsonWebKey,
  theirPublicKeyJWK: JsonWebKey
): Promise<CryptoKey> {
  const privateKey = await importPrivateKey(myPrivateKeyJWK);
  const publicKey = await importPublicKey(theirPublicKeyJWK);

  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext with AES-GCM
export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const encodedText = enc.encode(plaintext);

  // Generate 12-byte random initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encodedText
  );

  return {
    ciphertext: bufferToBase64(new Uint8Array(encryptedBuffer)),
    iv: bufferToBase64(iv)
  };
}

// Decrypt AES-GCM ciphertext
export async function decryptText(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource
    },
    key,
    ciphertext as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// Encrypt for a symmetric channel or group chat (using channel shared key)
export async function deriveChannelKey(chatId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(`telecrypt_group_salt_${chatId}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('telecrypt_channel_secure_v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compute Safety Number & 4 verification emojis for visual Telegram comparison
export async function computeSafetyFingerprint(
  keyA: string,
  keyB: string
): Promise<{ fingerprint: string; emojis: string[] }> {
  const sorted = [keyA, keyB].sort().join(':');
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(sorted));
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Convert to formatted hex string: "4A8F-9C12-3D7E-5B01..."
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const formattedHex = hex.slice(0, 32).match(/.{1,4}/g)?.join(' ') || hex.slice(0, 32);

  // Pick 4 emojis from deterministic byte indices
  const emojis = [
    EMOJI_SET[hashArray[0] % EMOJI_SET.length],
    EMOJI_SET[hashArray[1] % EMOJI_SET.length],
    EMOJI_SET[hashArray[2] % EMOJI_SET.length],
    EMOJI_SET[hashArray[3] % EMOJI_SET.length]
  ];

  return { fingerprint: formattedHex, emojis };
}

// Utilities
function bufferToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
