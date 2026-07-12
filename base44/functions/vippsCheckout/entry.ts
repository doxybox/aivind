import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VIPPS_BASE_URL = 'https://apitest.vipps.no';
const VIPPS_ENVIRONMENT = 'test';
const VIPPS_MSN = '504763';

function maskCredential(value) {
  if (!value) return 'NOT_SET';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

function logDebug(stage, details) {
  console.log(`[Vipps ${VIPPS_ENVIRONMENT}] ${stage}: ${JSON.stringify(details)}`);
}

async function createVippsCheckoutSession(orderId, price, userEmail, planName) {
  const clientId = Deno.env.get("VIPPS_CLIENT_ID");
  const clientSecret = Deno.env.get("VIPPS_CLIENT_SECRET");
  const subscriptionKey = Deno.env.get("VIPPS_SUBSCRIPTION_KEY");

  if (!clientId || !clientSecret || !subscriptionKey) {
    const missing = [];
    if (!clientId) missing.push('VIPPS_CLIENT_ID');
    if (!clientSecret) missing.push('VIPPS_CLIENT_SECRET');
    if (!subscriptionKey) missing.push('VIPPS_SUBSCRIPTION_KEY');
    throw new Error(`Missing credentials: ${missing.join(', ')}`);
  }

  const appBaseUrl = "https://aivind-tech-bladet.vercel.app";

  const sessionPayload = {
    reference: orderId,
    transaction: {
      amount: {
        value: price,
        currency: "NOK",
      },
      paymentDescription: planName,
    },
    merchantInfo: {
      merchantSerialNumber: VIPPS_MSN,
      returnUrl: `${appBaseUrl}/min-side?section=abonnement&payment=success`,
      callbackUrl: `${appBaseUrl}/api/vipps/callback`,
      callbackAuthorizationToken: "test-callback-token",
    },
    customerInfo: {
      email: userEmail,
    },
  };

  logDebug('REQUEST_INIT', {
    environment: VIPPS_ENVIRONMENT,
    baseUrl: VIPPS_BASE_URL,
    endpoint: '/checkout/v3/session',
    merchantSerialNumber: VIPPS_MSN,
    clientIdPrefix: maskCredential(clientId),
    subscriptionKeyPrefix: maskCredential(subscriptionKey),
    orderId,
    amount: Math.round(price * 100),
    currency: 'NOK',
  });

  const url = `${VIPPS_BASE_URL}/checkout/v3/session`;

  const response = await fetch(url, {
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
    body: JSON.stringify(sessionPayload),
  });

  const responseText = await response.text();
  const timestamp = new Date().toISOString();

  if (!response.ok) {
    logDebug('ERROR_RESPONSE', {
      timestamp,
      httpStatus: response.status,
      endpoint: url,
      environment: VIPPS_ENVIRONMENT,
      merchantSerialNumber: VIPPS_MSN,
      responseBody: responseText.substring(0, 500),
    });

    throw new Error(
      `Vipps Checkout session creation failed (${response.status}): ${responseText}`
    );
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    logDebug('PARSE_ERROR', {
      timestamp,
      responseText: responseText.substring(0, 500),
    });
    throw new Error(`Failed to parse Vipps response: ${responseText}`);
  }

  logDebug('SUCCESS_RESPONSE', {
    timestamp,
    httpStatus: response.status,
    orderId,
    vippsReference: data.reference,
    checkoutUrl: data.url ? 'PRESENT' : 'MISSING',
  });

  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { planType, planName, price, billingPeriod } = await req.json();

    if (!planType || !price) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = `ORD-${Date.now()}-${user.id.slice(0, 8)}`;

    console.log(`[Vipps] Creating checkout session for order ${orderId}`);

    const vippsSession = await createVippsCheckoutSession(
      orderId,
      price,
      user.email,
      planName
    );

    const checkoutSession = {
      orderId,
      vippsOrderId: vippsSession.reference || vippsSession.orderId,
      userId: user.id,
      planType,
      planName,
      price,
      billingPeriod,
      userEmail: user.email,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    console.log(`[Vipps] Session created: ${vippsSession.reference}`);

    return Response.json({
      success: true,
      orderId,
      vippsOrderId: vippsSession.reference,
      checkoutUrl: vippsSession.url,
      checkoutSession,
    });
  } catch (error) {
    console.error('[Vipps] Checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});