const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Build fallback URI from discrete env vars if available
function buildFallbackUri() {
  const host = process.env.DB_HOST;
  const name = process.env.DB_NAME || process.env.MONGO_DB || '';
  const user = process.env.DB_USER;
  const pass = process.env.DB_PASS;

  if (!host) return null;

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${name}?retryWrites=true&w=majority`;
  }

  return `mongodb://${host}/${name}?retryWrites=true&w=majority`;
}

module.exports = async () => {
  const uri = process.env.MONGO_URI;
  const connectOpts = {
    // Mongoose 6+ uses these by default but we keep them explicit for clarity
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000
  };

  try {
    if (!uri) throw new Error('MONGO_URI not set in environment');
    await mongoose.connect(uri, connectOpts);
    console.log('MongoDB connected');
    return;
  } catch (err) {
    console.error('Primary Mongo connection failed:', err.message || err);

    // Specific guidance for SRV hostname mismatch (common when using +srv with custom DNS)
    if (err && String(err.message).includes('Server record does not share hostname with parent URI')) {
      console.error('Detected SRV hostname mismatch. This typically happens when using a mongodb+srv URI whose SRV records point to hosts on a different domain.');
      console.error('Options:');
      console.error('- Use a standard mongodb://host:port URI in MONGO_URI (not +srv) that matches your server hosts.');
      console.error('- Or set DB_HOST/DB_USER/DB_PASS/DB_NAME environment variables and let the app attempt a non-SRV fallback.');
    }

    // Attempt a fallback if discrete host env vars are present
    const fallback = buildFallbackUri();
    if (fallback) {
      try {
        console.log('Attempting fallback Mongo connection to', fallback.split('?')[0]);
        await mongoose.connect(fallback, connectOpts);
        console.log('MongoDB connected using fallback URI');
        return;
      } catch (fallbackErr) {
        console.error('Fallback Mongo connection failed:', fallbackErr.message || fallbackErr);
      }
    }

    console.error('\nUnable to connect to MongoDB. Please verify your MONGO_URI or provide DB_HOST/DB_USER/DB_PASS/DB_NAME in your environment.');
    process.exit(1);
  }
};
