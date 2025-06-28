import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the filename from params
    const { filename } = params;
    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    // Find the invoice in the database to confirm it exists
    const invoiceRecords = await db
      .select()
      .from(invoices)
      .where(like(invoices.fileUrl, `%${filename}`));

    if (invoiceRecords.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check authorization:
    // - Admins/HR can access any invoice
    // - Developers can only access their own invoices
    const invoice = invoiceRecords[0];
    if (session.user.role === 'developer' && invoice.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to access this invoice' }, { status: 403 });
    }

    try {
      // In a serverless environment, the file would be retrieved from cloud storage
      // For now, we attempt to read from the tmp directory where it was stored
      const filePath = join('/tmp/invoices', filename);
      
      // Check if file exists in temp storage
      if (!existsSync(filePath)) {
        return NextResponse.json({ 
          error: 'Invoice file not found in temporary storage',
          message: 'The file may have been removed during server restart. Please contact support.'
        }, { status: 404 });
      }

      // Read the file content
      const fileBuffer = await readFile(filePath);

      // Get the original file extension and set appropriate content type
      const fileExtension = filename.split('.').pop()?.toLowerCase() || 'pdf';
      let contentType = 'application/octet-stream'; // Default content type

      if (fileExtension === 'pdf') {
        contentType = 'application/pdf';
      } else if (['jpg', 'jpeg'].includes(fileExtension)) {
        contentType = 'image/jpeg';
      } else if (fileExtension === 'png') {
        contentType = 'image/png';
      }

      // Return the file with proper headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    } catch (fileError) {
      console.error('File retrieval error:', fileError);
      
      return NextResponse.json({ 
        error: 'Failed to retrieve invoice file', 
        message: 'The file might have been deleted or server storage has been reset.',
        details: process.env.NODE_ENV === 'development' ? fileError : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in invoice download API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
