const dotenv = require('dotenv');
const { expand } = require('dotenv-expand');

const myEnv = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });

expand(myEnv);
