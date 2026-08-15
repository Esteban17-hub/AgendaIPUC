import CryptoJS from 'crypto-js';

// Generates a SHA-256 hash of the given PIN
export const hashPin = (pin) => {
  if (!pin) return '';
  // If the pin is already a 64-character hex string (SHA-256), don't re-hash it.
  if (/^[a-f0-9]{64}$/i.test(pin)) {
    return pin;
  }
  return CryptoJS.SHA256(pin).toString(CryptoJS.enc.Hex);
};

// Verifies a raw PIN against a stored hash
export const verifyPin = (rawPin, storedHash) => {
  if (!rawPin || !storedHash) return false;
  
  // Backward compatibility: if the stored hash is actually a plain text pin (length < 64)
  if (storedHash.length < 64) {
    return rawPin === storedHash;
  }

  const hashOfRaw = CryptoJS.SHA256(rawPin).toString(CryptoJS.enc.Hex);
  return hashOfRaw === storedHash;
};
