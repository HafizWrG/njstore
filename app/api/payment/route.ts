// app/api/payment/route.ts
import { NextResponse } from 'next/server';
import { Xendit } from 'xendit-node';

// Inisialisasi Xendit dengan Secret Key dari .env
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

const { Invoice } = xenditClient;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { external_id, amount, payer_email, description } = body;

    // Validasi data
    if (!external_id || !amount || !payer_email) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Request pembuatan Invoice ke Xendit
    const response = await Invoice.createInvoice({
      data: {
        externalId: external_id,
        amount: amount,
        payerEmail: payer_email,
        description: description,
        invoiceDuration: 86400, // Link valid 24 jam
        currency: 'IDR',
      },
    });

    // Kembalikan URL pembayaran ke Frontend
    return NextResponse.json({ 
      invoice_url: response.invoiceUrl, 
      id: response.id 
    });

  } catch (error: any) {
    console.error('Xendit Error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat invoice', details: error.message },
      { status: 500 }
    );
  }
}