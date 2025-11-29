import React, { useEffect, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

interface CampaignDetailsProps {
    campaignId: number;
}

export default function CampaignDetailsPage({ campaignId }: CampaignDetailsProps) {
    const { setCurrentPage } = useNavigation();
    const { toast } = useToast();
    const [campaign, setCampaign] = useState<any>(null);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaignDetails();
    }, [campaignId]);

    const loadCampaignDetails = async () => {
        try {
            const [campaignData, recipientsData] = await Promise.all([
                api.getCampaign(campaignId),
                api.getCampaignRecipients(campaignId)
            ]);
            setCampaign(campaignData);
            setRecipients(recipientsData);
        } catch (error) {
            console.error('Failed to load campaign details:', error);
            toast({
                title: "Error",
                description: "Failed to load campaign details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center">Loading campaign details...</div>;
    }

    if (!campaign) {
        return <div className="p-6 text-center">Campaign not found</div>;
    }

    const statusColors = {
        draft: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
        running: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
        paused: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
        completed: "bg-green-500/20 text-green-700 dark:text-green-400",
    };

    return (
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
                    <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                            {campaign.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            Created {new Date(campaign.created_at_epoch_ms).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaign.total_recipients}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sent Successfully</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{campaign.sent_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{campaign.failed_count}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Message Template</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap text-sm">{campaign.message_text}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recipients.map((recipient: any) => (
                            <div key={recipient.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <div>
                                    <p className="font-medium">{recipient.name || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground">{recipient.phone}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={recipient.status === 'sent' ? 'default' : recipient.status === 'failed' ? 'destructive' : 'outline'}>
                                        {recipient.status}
                                    </Badge>
                                    {recipient.sent_at_epoch_ms && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(recipient.sent_at_epoch_ms).toLocaleTimeString()}
                                        </p>
                                    )}
                                    {recipient.error_message && (
                                        <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={recipient.error_message}>
                                            {recipient.error_message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
