import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Get a specific invoice by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    
    const result = await db.select()
      .from(invoices)
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.id, id))
      .limit(1);
    
    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    const { invoices: invoice, users: user } = result[0];
    
    // Check permissions - developers can only access their own invoices
    if (session.user.role === 'developer' && user.id !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const formattedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalHours: invoice.totalHours,
      amount: invoice.amount,
      status: invoice.status,
      pdfUrl: invoice.pdfUrl,
      fileUrl: invoice.fileUrl,
      fileName: invoice.fileName,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      developer: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    };
    
    return NextResponse.json({ invoice: formattedInvoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// Update a specific invoice
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const body = await request.json();
    const { amount, status, pdfUrl, fileUrl, fileName } = body;
    
    const updateValues: any = {
      updatedAt: new Date(),
    };
    
    if (amount !== undefined) updateValues.amount = amount;
    if (status !== undefined) updateValues.status = status;
    if (pdfUrl !== undefined) updateValues.pdfUrl = pdfUrl;
    if (fileUrl !== undefined) updateValues.fileUrl = fileUrl;
    if (fileName !== undefined) updateValues.fileName = fileName;
    
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateValues)
      .where(eq(invoices.id, id))
      .returning();
    
    if (!updatedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// Delete an invoice
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    
    const [deletedInvoice] = await db
      .delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    
    if (!deletedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
