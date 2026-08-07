// Files are uploaded already-encrypted from the device (AES ciphertext bytes),
// so the server just stores opaque blobs and never sees plaintext media.
exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url });
};