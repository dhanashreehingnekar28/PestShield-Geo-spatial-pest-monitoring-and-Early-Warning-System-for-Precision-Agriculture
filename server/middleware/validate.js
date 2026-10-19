const fs = require('fs');
const { validationResult } = require('express-validator');

// Place after a list of express-validator rules. Stops the request with a 400 if any rule failed.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  // Do not keep an uploaded photo when the rest of the form was invalid
  if (req.file) fs.unlink(req.file.path, () => {});

  const errors = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: errors[0].message, errors });
};