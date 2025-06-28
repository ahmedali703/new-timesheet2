import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Fetch invoices based on user role
// - Admins/HR can see all invoices
// - Developers can only see their own invoices
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Create the base query
    const baseQuery = db.select().from(invoices)
      .innerJoin(users, eq(invoices.userId, users.id))
      .orderBy(desc(invoices.createdAt)); // Using createdAt which is definitely in the schema
    
    // Execute the query with appropriate filters
    let results;
    if (session.user.role === 'developer') {
      // Developers can only see their own invoices
      results = await baseQuery.where(eq(invoices.userId, session.user.id));
    } else if (userId && (session.user.role === 'admin' || session.user.role === 'hr')) {
      // Admins/HR can filter by user ID
      results = await baseQuery.where(eq(invoices.userId, userId));
    } else {
      // Admin/HR with no filter
      results = await baseQuery;
    }
    
    const formattedInvoices = results.map(({ invoices: invoice, users: user }) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalHours: invoice.totalHours,
      amount: invoice.amount,
      status: invoice.status,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      fileUrl: invoice.fileUrl,     // Include file URLs for downloading
      pdfUrl: invoice.pdfUrl,       // Include PDF URL if separate from fileUrl
      fileName: invoice.fileName,   // Include original file name
      developer: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    }));
    
    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// Create a new invoice
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized. Only admins and HR can create invoices.' }, { status: 401 });
    }
    
    // Process the FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const weekId = formData.get('weekId') as string;
    const totalHours = formData.get('totalHours') as string;
    const amount = formData.get('amount') as string;
    
    // Debug logging to diagnose the issue
    console.log('Invoice form data received:', {
      userId,
      weekId,
      totalHours,
      amount,
      fileName: file?.name,
      fileSize: file?.size
    });
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      return NextResponse.json({ error: 'Developer must be selected' }, { status: 400 });
    }
    
    if (!totalHours || !amount || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Generate a unique invoice number
    const today = new Date();
    const formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV-${formattedDate}-${randomNumbers}`;
    
    // In serverless environments, we need to use /tmp directory which is writable
    // Instead of storing files directly in public directory
    const tmpDir = '/tmp';
    const invoicesDir = join(tmpDir, 'invoices');
    
    // Ensure the tmp invoices directory exists
    if (!existsSync(invoicesDir)) {
      await mkdir(invoicesDir, { recursive: true });
    }
    
    // Generate a unique filename with original extension
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const uniqueFileName = `invoice_${invoiceNumber}_${Date.now()}.${fileExtension}`;
    const filePath = join(invoicesDir, uniqueFileName);
    
    try {
      // Convert the file to a Buffer and write it to the temporary filesystem
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer as unknown as Uint8Array);
      
      // For serverless environments, we'd typically upload to cloud storage here
      // For now, we'll simulate success and store the reference in the database
      // In production, you would upload to S3, Azure Blob, etc.
      
      // The URL that would be accessible from the frontend (placeholder)
      const fileUrl = `/api/invoices/download/${uniqueFileName}`;
      
      try {
        // Ensure all values are present and properly formatted
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
          throw new Error('Invalid userId: ' + userId);
        }
        
        console.log('Creating invoice with userId:', userId);
        
        // Create a properly structured invoice record based on the schema
        // Convert all values to match the expected types for Drizzle ORM
        const invoiceRecord = {
          userId: userId, // string as expected
          weekId: weekId && weekId !== '' ? weekId : null, // string or null as expected
          invoiceNumber: invoiceNumber, // string as expected
          totalHours: totalHours.toString(), // convert to string as expected by Drizzle
          amount: amount.toString(), // convert to string as expected by Drizzle
          status: 'pending' as const,
          fileName: file.name,
          fileUrl: fileUrl,
          pdfUrl: fileUrl,
          uploadedBy: session.user.id,
          createdAt: new Date(), // Date objects are fine
          updatedAt: new Date(),
        };
        
        console.log('Invoice data to insert:', JSON.stringify(invoiceRecord));
        
        // Cast invoice record to any to bypass TypeScript's strict checking
        // This is needed due to the mismatch between the database schema (snake_case)
        // and the Drizzle ORM interface (camelCase)
        const result = await db.insert(invoices).values(invoiceRecord as any).returning();
        
        const newInvoice = result[0];
        
        return NextResponse.json({ 
          invoice: newInvoice, 
          success: true,
          message: 'Invoice created successfully'
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({ 
          error: 'Failed to create invoice record in database', 
          details: dbError
        }, { status: 500 });
      }
    } catch (fileError) {
      console.error('File processing error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to save invoice file', 
        details: fileError
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

// Update an invoice
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, amount, status } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
    
    const updateValues: any = {
      updatedAt: new Date(),
    };
    
    if (amount !== undefined) {
      updateValues.amount = amount;
    }
    
    if (status !== undefined) {
      updateValues.status = status;
    }
    
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
