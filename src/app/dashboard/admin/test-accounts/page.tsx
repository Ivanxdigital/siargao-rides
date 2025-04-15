'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { toast } from 'react-hot-toast';
import { TestTube, Copy, RefreshCw, Trash, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';

// Type for test account
interface TestAccount {
  id: string;
  email: string;
  password: string;
  role: 'tourist' | 'shop_owner';
  first_name: string;
  last_name: string;
  created_at?: string;
}

export default function TestAccountsPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [role, setRole] = useState<'tourist' | 'shop_owner'>('tourist');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<TestAccount | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // Load test accounts from local storage on initial render
  useEffect(() => {
    const savedAccounts = localStorage.getItem('testAccounts');
    if (savedAccounts) {
      try {
        setTestAccounts(JSON.parse(savedAccounts));
      } catch (error) {
        console.error('Error parsing saved test accounts:', error);
        localStorage.removeItem('testAccounts');
      }
    }
  }, []);

  // Save test accounts to local storage whenever they change
  useEffect(() => {
    if (testAccounts.length > 0) {
      localStorage.setItem('testAccounts', JSON.stringify(testAccounts));
    }
  }, [testAccounts]);

  // Handle form submission
  const handleCreateTestAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      console.log('Creating test account with role:', role);
      const response = await fetch('/api/admin/create-test-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          emailPrefix: emailPrefix.trim() || undefined,
        }),
      });

      const data = await response.json();
      console.log('API response:', response.status, data);

      if (!response.ok) {
        // Show a more detailed error message
        const errorMessage = data.error || 'Failed to create test account';
        console.error('Error creating test account:', errorMessage);
        toast.error(`Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Add the new account to the list
      setTestAccounts([
        {
          ...data.user,
          created_at: new Date().toISOString(),
        },
        ...testAccounts,
      ]);

      toast.success('Test account created successfully');
      setEmailPrefix('');
    } catch (error) {
      console.error('Error creating test account:', error);
      // Error is already shown in the if (!response.ok) block
      // Only show a generic error if it's not already handled
      if (!error.message || error.message === 'Failed to create test account') {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Copy account credentials to clipboard
  const copyCredentials = (account: TestAccount) => {
    const credentials = `Email: ${account.email}\nPassword: ${account.password}\nRole: ${account.role}`;
    navigator.clipboard.writeText(credentials)
      .then(() => toast.success('Credentials copied to clipboard'))
      .catch(() => toast.error('Failed to copy credentials'));
  };

  // Delete account from local storage
  const deleteAccount = (account: TestAccount) => {
    setAccountToDelete(account);
    setShowDeleteDialog(true);
  };

  // Confirm delete account
  const confirmDeleteAccount = () => {
    if (accountToDelete) {
      setTestAccounts(testAccounts.filter(acc => acc.id !== accountToDelete.id));
      toast.success('Account removed from list');
      setShowDeleteDialog(false);
      setAccountToDelete(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="pt-2 md:pt-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-white">
          Test Accounts
        </h1>
        <p className="text-white/70 text-sm md:text-base">
          Create and manage test accounts for development and testing purposes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Create Test Account Form */}
        <div className="lg:col-span-1">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TestTube className="h-5 w-5 text-purple-500" />
              </div>
              <h2 className="text-lg font-semibold text-white/90">Create Test Account</h2>
            </div>

            <form onSubmit={handleCreateTestAccount}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role" className="text-white/80">Account Role</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(value) => setRole(value as 'tourist' | 'shop_owner')}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tourist" id="tourist" />
                      <Label htmlFor="tourist" className="text-white/70">Tourist</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shop_owner" id="shop_owner" />
                      <Label htmlFor="shop_owner" className="text-white/70">Shop Owner</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="emailPrefix" className="text-white/80">
                    Email Prefix (Optional)
                  </Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="emailPrefix"
                      value={emailPrefix}
                      onChange={(e) => setEmailPrefix(e.target.value)}
                      placeholder="custom-prefix"
                      className="rounded-r-none border-r-0"
                    />
                    <div className="bg-black/30 border border-white/10 border-l-0 rounded-r-md px-3 py-2 text-white/50">
                      @siargaorides.test
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Leave blank to generate a random email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Test Account'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Test Accounts List */}
        <div className="lg:col-span-2">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white/90">Test Accounts</h2>
              <p className="text-sm text-white/60">
                These accounts are stored locally in your browser
              </p>
            </div>

            {testAccounts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-white/60">No test accounts created yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/70">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Email</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Password</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Role</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Created</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {testAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white/90">{account.email}</td>
                        <td className="px-4 py-3 text-white/90">
                          <span className="font-mono bg-black/30 px-2 py-1 rounded text-sm">
                            {account.password}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            account.role === 'shop_owner'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70 text-sm">
                          {account.created_at ? formatDate(account.created_at) : 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCredentials(account)}
                              className="h-8 w-8 p-0"
                              title="Copy credentials"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAccount(account)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Remove from list"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg mb-8">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/90 mb-2">Important Notes</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Test accounts are created with email verification already confirmed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Account credentials are only stored in your local browser storage</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>If you clear your browser data, you'll lose access to these credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>These accounts are real accounts in the database and can be used for testing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use these accounts only for testing purposes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Test Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this test account from your list?
              This will only remove it from your local list, not from the database.
            </DialogDescription>
          </DialogHeader>

          {accountToDelete && (
            <div className="bg-muted/20 p-3 rounded-md">
              <p className="text-sm"><strong>Email:</strong> {accountToDelete.email}</p>
              <p className="text-sm"><strong>Role:</strong> {accountToDelete.role}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAccount}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
