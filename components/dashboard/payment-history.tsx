'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Invoice {
  id: string;
  userId: string;
  weekId: string | null;
  weekStartDate: string | null;
  weekEndDate: string | null;
  totalHours: number;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  paymentDate: string | null;
  invoiceNumber: string;
  pdfUrl: string | null;
  fileName: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function PaymentHistory() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // Using the general invoices endpoint - it will filter by the current user's session
      const response = await fetch('/api/invoices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      setInvoices(data.invoices.map((invoice: any) => ({
        ...invoice,
        createdAt: new Date(invoice.createdAt).toISOString(),
        updatedAt: new Date(invoice.updatedAt).toISOString()
      })));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>
          View all your invoices and payment status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-gray-300">Loading invoice history...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p className="text-lg font-medium text-gray-200">No invoices yet</p>
            <p className="text-sm mt-1 text-gray-400">
              Your payment history will appear here once you submit your first timesheet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-800/50">
                    <TableCell className="font-medium text-gray-200">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      {formatDate(invoice.createdAt)}
                    </TableCell>
                    <TableCell>{invoice.totalHours}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{invoice.status === 'paid' ? formatDate(invoice.paymentDate) : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async (e) => {
                          e.preventDefault();
                          // Get the fileUrl from the invoice record
                          const fileUrl = invoice.fileUrl || invoice.pdfUrl;
                          
                          if (!fileUrl) {
                            toast({
                              title: "No file available",
                              description: "This invoice doesn't have an attached file. Please contact the admin.",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          try {
                            // With our new implementation, the fileUrl is in format: `/api/invoices/download/${filename}`
                            // We can directly open this URL to download the file via our API endpoint
                            window.open(fileUrl, '_blank');
                          } catch (error) {
                            console.error('Error downloading file:', error);
                            toast({
                              title: "Download error",
                              description: "There was a problem downloading the file. Please try again later.",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="hover:bg-gray-800 border-gray-700 text-gray-300"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {invoice.fileName || 'Download'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
