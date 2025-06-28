'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UploadCloud, FileText, Users, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Developer {
  id: string;
  name: string;
  email: string;
}

interface PaymentEvidence {
  id: string;
  userId: string;
  filename: string;
  fileUrl: string;
  uploadedAt: string;
  weekId: string;
  uploadedBy: {
    name: string;
    role: string;
  };
}

interface Week {
  id: string;
  startDate: string;
  endDate: string;
}

export function PaymentEvidence() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [paymentEvidences, setPaymentEvidences] = useState<PaymentEvidence[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDevelopers();
    fetchWeeks();
  }, []);
  
  const fetchPaymentEvidences = useCallback(async () => {
    if (!selectedDeveloper || !selectedWeek) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payments?userId=${selectedDeveloper}&weekId=${selectedWeek}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentEvidences(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payment evidences:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDeveloper, selectedWeek]);

  useEffect(() => {
    if (selectedDeveloper && selectedWeek) {
      fetchPaymentEvidences();
    }
  }, [selectedDeveloper, selectedWeek, fetchPaymentEvidences]);
  
  const fetchDevelopers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=developer');
      if (response.ok) {
        const data = await response.json();
        setDevelopers(data.users);
      }
    } catch (error) {
      console.error('Error fetching developers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchWeeks = async () => {
    try {
      const response = await fetch('/api/admin/weeks');
      if (response.ok) {
        const data = await response.json();
        setWeeks(data.weeks);
        // Set the latest week as default
        if (data.weeks.length > 0) {
          setSelectedWeek(data.weeks[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching weeks:', error);
    }
  };
  

  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedDeveloper || !selectedWeek) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', selectedDeveloper);
    formData.append('weekId', selectedWeek);
    
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setFile(null);
        fetchPaymentEvidences();
      }
    } catch (error) {
      console.error('Error uploading payment evidence:', error);
    } finally {
      setUploading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Evidence</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Payment Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="developer" className="block text-sm font-medium text-gray-700 mb-1">
                  Developer
                </label>
                <select
                  id="developer"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={selectedDeveloper}
                  onChange={(e) => setSelectedDeveloper(e.target.value)}
                  required
                >
                  <option value="">Select Developer</option>
                  {developers.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="week" className="block text-sm font-medium text-gray-700 mb-1">
                  Week Period
                </label>
                <select
                  id="week"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  required
                >
                  <option value="">Select Week</option>
                  {weeks.map((week) => (
                    <option key={week.id} value={week.id}>
                      {formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Document
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
                <Button type="submit" disabled={uploading || !file}>
                  {uploading ? (
                    'Uploading...'
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, JPG, JPEG, PNG
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {selectedDeveloper && selectedWeek && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Uploaded Documents
          </h3>
          
          {paymentEvidences.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payment documents uploaded yet for this developer and week.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {paymentEvidences.map((evidence) => (
                <Card key={evidence.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-6 w-6 text-blue-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{evidence.filename}</h4>
                        <p className="text-sm text-gray-500">
                          Uploaded by {evidence.uploadedBy.name} ({evidence.uploadedBy.role}) on {formatDate(new Date(evidence.uploadedAt))}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => window.open(evidence.fileUrl, '_blank')}>
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
