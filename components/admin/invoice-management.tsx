'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '../ui/card';
import { useToast } from "../ui/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Loader2, FileUp, Download, Edit, Trash, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Developer {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  image?: string;
}

interface Week {
  id: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  hasTasksCompleted: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalHours: number;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  developer: {
    id: string;
    name: string;
    email: string;
  };
}

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'paid' | 'rejected'>('pending');
  
  // Fetch invoices
  useEffect(() => {
    fetchInvoices();
    fetchDevelopers();
  }, []);
  
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices.map((invoice: any) => ({
          ...invoice,
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt),
        })));
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load invoices',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDevelopers = async () => {
    try {
      const response = await fetch('/api/users?role=developer');
      if (response.ok) {
        const data = await response.json();
        setDevelopers(data.users);
      }
    } catch (error) {
      console.error('Error fetching developers:', error);
    }
  };
  
  const createInvoice = async () => {
    try {
      // Enhanced field validation
      if (!selectedDeveloper || selectedDeveloper.trim() === '') {
        toast({
          title: 'Developer Required',
          description: 'Please select a developer for this invoice',
          variant: 'destructive',
        });
        return;
      }
      
      if (!totalHours || !amount) {
        toast({
          title: 'Missing Information',
          description: 'Total hours and amount are required',
          variant: 'destructive',
        });
        return;
      }

      if (!invoiceFile) {
        toast({
          title: 'File Required',
          description: 'Please upload an invoice file',
          variant: 'destructive',
        });
        return;
      }

      // Log all form values for debugging
      console.log('Creating invoice with form values:', {
        developerId: selectedDeveloper,
        developerName: developers.find(d => d.id === selectedDeveloper)?.name,
        weekId: selectedWeek || 'none',
        totalHours,
        amount,
        fileName: invoiceFile?.name,
        fileSize: invoiceFile?.size
      });
      
      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', invoiceFile);
      formData.append('userId', selectedDeveloper);
      
      // Only append weekId if one is selected
      if (selectedWeek && selectedWeek.trim() !== '') {
        formData.append('weekId', selectedWeek);
      }
      
      formData.append('totalHours', totalHours);
      formData.append('amount', amount);
      
      // Show loading toast
      toast({
        title: 'Processing',
        description: 'Creating invoice and uploading file...',
      });
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        body: formData,
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        console.log('Invoice created successfully:', responseData);
        toast({
          title: 'Success',
          description: 'Invoice has been created successfully',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        // Refresh invoices list
        fetchInvoices();
      } else {
        console.error('Failed to create invoice:', responseData);
        toast({
          title: 'Error',
          description: responseData.error || responseData.details || 'Failed to create invoice',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    }
  };
  
  const handleEditInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setEditAmount(invoice.amount.toString());
    setEditStatus(invoice.status);
    setIsEditDialogOpen(true);
  };
  
  const updateInvoice = async () => {
    if (!currentInvoice || !editAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/invoices/${currentInvoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          status: editStatus,
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invoice has been updated successfully',
        });
        setIsEditDialogOpen(false);
        fetchInvoices();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to update invoice',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
    }
  };
  
  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invoice has been deleted successfully',
        });
        fetchInvoices();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to delete invoice',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };
  
  // Calculate invoice amount based on developer hourly rate and total hours
  const calculateInvoiceAmount = useCallback((hours?: string) => {
    const hoursToCalculate = hours || totalHours;
    const developer = developers.find(dev => dev.id === selectedDeveloper);
    if (developer && developer.hourlyRate && hoursToCalculate) {
      const calculatedAmount = parseFloat(hoursToCalculate) * parseFloat(developer.hourlyRate.toString());
      setAmount(calculatedAmount.toFixed(2));
    }
  }, [developers, selectedDeveloper, totalHours]);
  
  // Watch for changes in selected developer or hours to auto-calculate amount
  useEffect(() => {
    if (totalHours && selectedDeveloper) {
      calculateInvoiceAmount();
    }
  }, [totalHours, selectedDeveloper, calculateInvoiceAmount]);
  
  // Reset form fields when dialog is closed
  const resetForm = () => {
    setSelectedDeveloper('');
    setSelectedWeek('');
    setTotalHours('');
    setAmount('');
    setInvoiceFile(null);
    setAvailableWeeks([]);
  };

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isCreateDialogOpen) {
      resetForm();
    }
  }, [isCreateDialogOpen]);
  
  // Fetch available weeks when a developer is selected
  const fetchAvailableWeeks = async (developerId: string) => {
    if (!developerId) return;
    
    setWeekLoading(true);
    try {
      const response = await fetch(`/api/admin/weeks/closed?developerId=${developerId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableWeeks(data.weeks);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch available weeks',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching weeks:', error);
    } finally {
      setWeekLoading(false);
    }
  };

  // Handle developer selection change
  const handleDeveloperChange = (developerId: string) => {
    setSelectedDeveloper(developerId);
    setSelectedWeek('');
    fetchAvailableWeeks(developerId);
  };

  // Handle week selection change
  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId);
    
    // Find selected week and update hours from its tasks
    const selectedWeekData = availableWeeks.find(week => week.id === weekId);
    if (selectedWeekData) {
      setTotalHours(selectedWeekData.totalHours.toString());
      // Calculate amount based on developer rate
      calculateInvoiceAmount(selectedWeekData.totalHours.toString());
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>Create and manage invoices for developers</CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="developer">Developer</Label>
                <Select
                  value={selectedDeveloper}
                  onValueChange={handleDeveloperChange}
                >
                  <SelectTrigger id="developer">
                    <SelectValue placeholder="Select a developer" />
                  </SelectTrigger>
                  <SelectContent>
                    {developers.map((developer) => (
                      <SelectItem key={developer.id} value={developer.id}>
                        {developer.name} (${developer.hourlyRate}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="week">Week</Label>
                <Select
                  value={selectedWeek}
                  onValueChange={handleWeekChange}
                  disabled={!selectedDeveloper || weekLoading}
                >
                  <SelectTrigger id="week">
                    <SelectValue placeholder={weekLoading ? "Loading weeks..." : "Select a week"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWeeks.length > 0 ? (
                      availableWeeks.map((week) => {
                        const startDate = new Date(week.startDate).toLocaleDateString();
                        const endDate = new Date(week.endDate).toLocaleDateString();
                        return (
                          <SelectItem key={week.id} value={week.id}>
                            {startDate} to {endDate} ({week.totalHours} hrs)
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem disabled value="none">
                        No available weeks found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalHours">Total Hours</Label>
                <Input
                  id="totalHours"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalHours}
                  onChange={(e) => {
                    setTotalHours(e.target.value);
                    calculateInvoiceAmount(e.target.value);
                  }}
                  placeholder="Enter total hours"
                  readOnly={!!selectedWeek}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceFile">Upload Invoice File</Label>
                <Input
                  id="invoiceFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                {invoiceFile && (
                  <p className="text-xs text-green-600">Selected: {invoiceFile.name}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createInvoice}>
                Create Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Invoice Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
            </DialogHeader>
            {currentInvoice && (
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm font-medium mb-1">Invoice Number</p>
                  <p className="text-sm">{currentInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Developer</p>
                  <p className="text-sm">{currentInvoice.developer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Total Hours</p>
                  <p className="text-sm">{currentInvoice.totalHours}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAmount">Amount ($)</Label>
                  <Input
                    id="editAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editStatus} onValueChange={(value: 'pending' | 'paid' | 'rejected') => setEditStatus(value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateInvoice}>
                Update Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.developer.name}</TableCell>
                      <TableCell className="text-right">{invoice.totalHours}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInvoice(invoice.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
