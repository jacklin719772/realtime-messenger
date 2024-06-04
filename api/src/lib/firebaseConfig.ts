
import admin from 'firebase-admin';
import httpProxyAgent from 'https-proxy-agent';

import { initializeApp } from 'firebase-admin/app';

const httpAgent = new (httpProxyAgent as any)('http://127.0.0.1:4001/');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount, httpAgent),
  httpAgent,
});

console.log(admin.apps);

export default admin;