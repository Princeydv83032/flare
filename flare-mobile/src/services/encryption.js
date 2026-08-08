// End-to-end encryption. Each device generates a Curve25519 keypair once at
// registration - the private key never leaves the device (stored in AsyncStorage).
// The public key is uploaded to the server so others can encrypt messages to us.
import "react-native-get-random-values";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIVATE_KEY_STORAGE = "flare_private_key";
const PUBLIC_KEY_STORAGE = "flare_public_key";

export async function getOrCreateKeyPair() {
  const existingPriv = await AsyncStorage.getItem(PRIVATE_KEY_STORAGE);
  const existingPub = await AsyncStorage.getItem(PUBLIC_KEY_STORAGE);
  if (existingPriv && existingPub) {
    return { publicKey: existingPub, secretKey: existingPriv };
  }

  const keyPair = nacl.box.keyPair();
  const publicKey = naclUtil.encodeBase64(keyPair.publicKey);
  const secretKey = naclUtil.encodeBase64(keyPair.secretKey);

  await AsyncStorage.setItem(PRIVATE_KEY_STORAGE, secretKey);
  await AsyncStorage.setItem(PUBLIC_KEY_STORAGE, publicKey);

  return { publicKey, secretKey };
}

export async function getMyPrivateKey() {
  return AsyncStorage.getItem(PRIVATE_KEY_STORAGE);
}

// Encrypts `plaintext` once, wraps the content-key for every recipient.
export function encryptMessage(plaintext, mySecretKeyB64, recipients) {
  const mySecretKey = naclUtil.decodeBase64(mySecretKeyB64);

  const contentKey = nacl.randomBytes(nacl.secretbox.keyLength);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

  const messageBytes = naclUtil.decodeUTF8(plaintext);
  const box = nacl.secretbox(messageBytes, nonce, contentKey);

  const keys = recipients.map(({ userId, publicKey }) => {
    const theirPublicKey = naclUtil.decodeBase64(publicKey);
    const keyNonce = nacl.randomBytes(nacl.box.nonceLength);
    const wrapped = nacl.box(contentKey, keyNonce, theirPublicKey, mySecretKey);
    const packed = new Uint8Array(keyNonce.length + wrapped.length);
    packed.set(keyNonce);
    packed.set(wrapped, keyNonce.length);
    return { userId, encryptedKey: naclUtil.encodeBase64(packed) };
  });

  return {
    ciphertext: naclUtil.encodeBase64(box),
    iv: naclUtil.encodeBase64(nonce),
    keys,
  };
}

export function decryptMessage({
  ciphertext,
  iv,
  myEncryptedKey,
  senderPublicKey,
  mySecretKeyB64,
}) {
  const mySecretKey = naclUtil.decodeBase64(mySecretKeyB64);
  const senderPub = naclUtil.decodeBase64(senderPublicKey);

  const packed = naclUtil.decodeBase64(myEncryptedKey);
  const keyNonce = packed.slice(0, nacl.box.nonceLength);
  const wrapped = packed.slice(nacl.box.nonceLength);

  const contentKey = nacl.box.open(wrapped, keyNonce, senderPub, mySecretKey);
  if (!contentKey)
    throw new Error("Failed to unwrap message key (wrong keys?)");

  const nonce = naclUtil.decodeBase64(iv);
  const box = naclUtil.decodeBase64(ciphertext);
  const plaintextBytes = nacl.secretbox.open(box, nonce, contentKey);
  if (!plaintextBytes)
    throw new Error("Failed to decrypt message (tampered or wrong key)");

  return naclUtil.encodeUTF8(plaintextBytes);
}
