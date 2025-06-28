import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, weeks, payments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface InvoiceResponse {
  id: string;
  weekId: string | null;
  weekStartDate: Date | null;
  weekEndDate: Date | null;
  totalHours: string | number; // Can be string or number based on DB return
  totalAmount: string | number; // Can be string or number based on DB return
  status: string;
  invoiceNumber: string;
  pdfUrl: string | null;
  createdAt: Date;
  paymentDate: Date | null;
}

// GET - Fetch invoices for the authenticated developer
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invoices for the current user with week data
    const userInvoices = await db
      .select({
        id: invoices.id,
        weekId: invoices.weekId,
        weekStartDate: weeks.startDate,
        weekEndDate: weeks.endDate,
        totalHours: invoices.totalHours,
        totalAmount: invoices.amount,
        status: invoices.status,
        invoiceNumber: invoices.invoiceNumber,
        pdfUrl: invoices.pdfUrl,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .innerJoin(weeks, eq(invoices.weekId, weeks.id))
      .where(eq(invoices.userId, session.user.id))
      .orderBy(desc(invoices.createdAt));
      
    // Transform results to include payment date
    const result: InvoiceResponse[] = userInvoices.map(invoice => ({
      ...invoice,
      paymentDate: null
    }));

    // Get payment dates for paid invoices
    for (let i = 0; i < result.length; i++) {
      const invoice = result[i];
      
      if (invoice.status === 'paid' && invoice.weekId) {
        const paymentData = await db
          .select({
            paymentDate: payments.paidAt,
          })
          .from(payments)
          .where(
            and(
              eq(payments.userId, session.user.id),
              eq(payments.weekId, invoice.weekId)
            )
          )
          .limit(1);
          
        if (paymentData.length > 0) {
          result[i].paymentDate = paymentData[0].paymentDate;
        }
      }
    }

    return NextResponse.json({ invoices: result });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
