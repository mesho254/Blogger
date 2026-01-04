import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTheme, styles } from '../styles/theme';

function Donate() {
  const theme = useTheme();
  const [amount, setAmount] = useState(10);

  return (
    <div style={{ padding: styles.padding, background: theme.background }}>
      <h2>Donate</h2>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ marginBottom: styles.margin }} />
      <PayPalScriptProvider options={{ 'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
        <PayPalButtons
          createOrder={async () => {
            const res = await api.post('/payments/paypal/create', { amount });
            return res.data.id;
          }}
          onApprove={async (data) => {
            await api.post('/payments/paypal/verify', { orderId: data.orderID });
            toast.success('Donation successful');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}

export default Donate;