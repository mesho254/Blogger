const paypal = require('@paypal/checkout-server-sdk');

let environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
let client = new paypal.core.PayPalHttpClient(environment);

exports.createPayment = async (req, res) => {
  let request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: req.body.amount
      }
    }]
  });
  let response = await client.execute(request);
  res.json({ id: response.result.id });
};

exports.verifyPayment = async (req, res) => {
  let request = new paypal.orders.OrdersCaptureRequest(req.body.orderId);
  request.requestBody({});
  let response = await client.execute(request);
  // Save transaction to DB
  res.json(response.result);
};