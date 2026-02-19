import axios from 'axios';

const PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com';

export async function getPayPalAccessToken() {
  const response = await axios({
    url: `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    method: 'post',
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: 'grant_type=client_credentials',
  });

  return response.data.access_token;
}

export { PAYPAL_BASE_URL };
