import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VIPPS_BASE_URL = 'https://apitest.vipps.no';
const VIPPS_ENVIRONMENT = 'test';
const VIPPS_MSN = '504763';

function maskCredential(value) {
  if (!value) return 'NOT_SET';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get("VIPPS_CLIENT_ID");
    const clientSecret = Deno.env.get("VIPPS_CLIENT_SECRET");
    const subscriptionKey = Deno.env.get("VIPPS_SUBSCRIPTION_KEY");

    const debugInfo = {
      environment: VIPPS_ENVIRONMENT,
      baseUrl: VIPPS_BASE_URL,
      endpoint: '/checkout/v3/session',
      merchantSerialNumber: VIPPS_MSN,
      credentialsSet: {
        clientId: clientId ? 'YES' : 'NO',
        clientSecret: clientSecret ? 'YES' : 'NO',
        subscriptionKey: subscriptionKey ? 'YES' : 'NO',
      },
      credentialsMasked: {
        clientId: maskCredential(clientId),
        subscriptionKey: maskCredential(subscriptionKey),
      },
    };

    if (!clientId || !clientSecret || !subscriptionKey) {
      return Response.json({
        status: 'MISSING_CREDENTIALS',
        debug: debugInfo,
      }, { status: 400 });
    }

    const testOrderId = `TEST-${Date.now()}-${user.id.slice(0, 8)}`;
    const testPayload = {
      reference: testOrderId,
      transaction: {
        amount: {
          value: 199.00,
          currency: "NOK",
        },
        paymentDescription: "Test Checkout Session",
      },
      merchantInfo: {
        merchantSerialNumber: VIPPS_MSN,
        returnUrl: "https://aivind-tech-bladet.vercel.app/test?status=success",
        callbackUrl: "https://aivind-tech-bladet.vercel.app/api/vipps/callback",
        callbackAuthorizationToken: "test-callback-token",
      },
      customerInfo: {
        email: user.email,
      },
    };

    const timestamp = new Date().toISOString();
    const response = await fetch(`${VIPPS_BASE_URL}/checkout/v3/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client_id': clientId,
        'client_secret': clientSecret,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Merchant-Serial-Number': VIPPS_MSN,
        'Vipps-System-Name': 'base44',
        'Vipps-System-Version': '1.0.0',
        'Vipps-System-Plugin-Name': 'base44',
        'Vipps-System-Plugin-Version': '1.0.0',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = null;
    }

    return Response.json({
      status: response.ok ? 'SUCCESS' : 'FAILED',
      httpStatus: response.status,
      timestamp,
      debug: debugInfo,
      request: {
        url: `${VIPPS_BASE_URL}/checkout/v3/session`,
        method: 'POST',
        orderId: testOrderId,
        amount: 9900,
        currency: 'NOK',
        email: user.email,
      },
      response: {
        status: response.status,
        headers: {
          contentType: response.headers.get('content-type'),
        },
        body: responseJson || responseText,
      },
    });
  } catch (error) {
    return Response.json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});