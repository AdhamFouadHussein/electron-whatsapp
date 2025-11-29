import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../../context/NavigationContext';
import { api } from '../../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Users, Upload, FileUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: number;
  name: string;
  phone: string;
  tags?: string[];
}

interface CsvRecipient {
  name: string;
  phone: string;
}

interface NewCampaignPageProps {
  editId?: number;
}

export default function NewCampaignPage({ editId }: NewCampaignPageProps) {
  const { setCurrentPage } = useNavigation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [csvRecipients, setCsvRecipients] = useState<CsvRecipient[]>([]);
  const [saveToContacts, setSaveToContacts] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    messageTemplate: '',
    scheduledTime: '',
  });

  useEffect(() => {
    const init = async () => {
      const fetchedUsers = await loadUsers();
      if (editId && fetchedUsers) {
        await loadCampaign(editId, fetchedUsers);
      }
    };
    init();
  }, [editId]);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
      return fetchedUsers;
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
      return null;
    }
  };

  const loadCampaign = async (id: number, currentUsers: User[]) => {
    try {
      setIsLoading(true);
      const campaign = await api.getCampaign(id);
      const recipients = await api.getCampaignRecipients(id);

      setFormData({
        name: campaign.name,
        messageTemplate: campaign.message_text,
        scheduledTime: '',
      });

      const userPhoneMap = new Map(currentUsers.map(u => [u.phone, u.id]));
      const newSelectedUsers: number[] = [];
      const newCsvRecipients: CsvRecipient[] = [];

      recipients.forEach((r: any) => {
        if (userPhoneMap.has(r.phone)) {
          newSelectedUsers.push(userPhoneMap.get(r.phone)!);
        } else {
          newCsvRecipients.push({ name: r.name || '', phone: r.phone });
        }
      });

      setSelectedUsers(newSelectedUsers);
      setCsvRecipients(newCsvRecipients);

    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const result = await api.parseCSV(content);
        setCsvRecipients(result.recipients);
        if (result.warnings.length > 0) {
          toast({
            title: "Warning",
            description: `Imported with warnings: ${result.warnings.length} issues found.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: `Imported ${result.recipients.length} recipients.`,
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.messageTemplate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const dbRecipients = users
      .filter(u => selectedUsers.includes(u.id))
      .map(u => ({ name: u.name, phone: u.phone }));

    const allRecipients = [...dbRecipients, ...csvRecipients];

    if (allRecipients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one recipient or import from CSV",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Save to contacts if requested
      if (saveToContacts && csvRecipients.length > 0) {
        await api.createUsers(csvRecipients);
      }

      // 2. Create or Update the campaign
      let campaignId = editId;

      if (editId) {
        await api.updateCampaign(editId, {
          name: formData.name,
          message_text: formData.messageTemplate,
        });

        // Clear existing recipients before adding new ones
        await api.clearCampaignRecipients(editId);
      } else {
        const newCampaign = await api.createCampaign({
          name: formData.name,
          message_text: formData.messageTemplate,
          scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime).toISOString() : undefined,
          status: 'draft'
        });
        campaignId = newCampaign.id;
      }

      // 3. Add recipients
      if (campaignId) {
        await api.addCampaignRecipients(campaignId, allRecipients);
      }

      toast({
        title: "Success",
        description: editId ? "Campaign updated successfully" : "Campaign created successfully",
      });

      // Navigate back to campaigns list
      setCurrentPage('campaigns');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }; return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage('campaigns')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{editId ? 'Edit Campaign' : 'New Campaign'}</h1>
          <p className="text-muted-foreground">{editId ? 'Edit existing campaign' : 'Create a new messaging campaign'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale Announcement"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Template</Label>
                <Textarea
                  id="message"
                  placeholder="Hi {{name}}, check out our latest offers! [NO SPACES BETWEEN BRACES]"
                  className="min-h-[150px]"
                  value={formData.messageTemplate}
                  onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{name}'}, {'{phoneNumber}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule (Optional)</Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to send immediately after activation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                Recipients
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} selected
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4 flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all">Select All Users</Label>
              </div>

              <div className="h-[400px] overflow-y-auto space-y-2 border rounded-md p-2">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found. Add users in the Users tab first.
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="flex-1 cursor-pointer flex justify-between"
                      >
                        <span>{user.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {user.phone}
                        </span>
                      </Label>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Import from CSV</Label>
                    <p className="text-xs text-muted-foreground">Upload a CSV file with 'phone' and optional 'name' columns</p>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button type="button" variant="outline" size="sm" className="gap-2">
                      <FileUp className="h-4 w-4" />
                      Upload CSV
                    </Button>
                  </div>
                </div>

                {csvRecipients.length > 0 && (
                  <div className="space-y-3 bg-muted/30 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {csvRecipients.length} recipients imported
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          setCsvRecipients([]);
                          setSaveToContacts(false);
                        }}
                      >
                        Clear
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="save-contacts"
                        checked={saveToContacts}
                        onCheckedChange={(checked) => setSaveToContacts(checked as boolean)}
                      />
                      <Label htmlFor="save-contacts" className="cursor-pointer">Save imported recipients to contacts</Label>
                    </div>

                    <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 text-sm bg-background">
                      {csvRecipients.map((r, i) => (
                        <div key={i} className="flex justify-between py-1 border-b last:border-0 border-border/50">
                          <span className="truncate max-w-[120px]">{r.name || 'Unknown'}</span>
                          <span className="text-muted-foreground font-mono text-xs">{r.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentPage('campaigns')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {editId ? 'Update Campaign' : 'Create Campaign'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
