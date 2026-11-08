import { Clock, type LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase?: string;
}

export function ComingSoonPage({ title, description, icon: Icon, phase }: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Icon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              This module is being built and will be available in {phase || 'a future update'}.
              We're working hard to bring you a complete church management experience.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              In Development
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
