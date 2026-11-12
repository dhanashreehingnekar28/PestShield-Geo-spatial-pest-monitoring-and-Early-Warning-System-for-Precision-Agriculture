const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const directory = path.join(__dirname, '../uploads');
const collection = () => mongoose.connection.collection('reportImages');
const persistUpload = async (file) => {
  if (process.env.UPLOAD_STORAGE !== 'mongodb') return;
  await collection().updateOne({ _id: file.filename }, { $set: {
    data: await fs.promises.readFile(file.path), contentType: file.mimetype,
  } }, { upsert: true });
};
const removeUpload = async (url) => {
  if (!url || !url.startsWith('/uploads/')) return;
  const name = url.slice('/uploads/'.length);
  if (path.basename(name) !== name) return;
  if (process.env.UPLOAD_STORAGE === 'mongodb') await collection().deleteOne({ _id: name });
  await fs.promises.unlink(path.join(directory, name)).catch(() => {});
};
const serveUpload = async (req, res, next) => {
  if (process.env.UPLOAD_STORAGE !== 'mongodb') return next();
  try {
    const photo = await collection().findOne({ _id: req.params.filename });
    if (!photo) return res.sendStatus(404);
    res.set('Content-Type', photo.contentType);
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(Buffer.from(photo.data.buffer));
  } catch (err) { next(err); }
};
module.exports = { persistUpload, removeUpload, serveUpload };
