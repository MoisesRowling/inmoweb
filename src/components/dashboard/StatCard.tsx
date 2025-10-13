import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  isCurrency?: boolean;
  color?: 'primary' | 'accent' | 'green' | 'orange';
}

export function StatCard({ title, value, description, icon: Icon, isCurrency = false, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    green: 'bg-green-500/10 text-green-600 dark:text-green-500',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-500',
  };
  const descriptionColorClasses = {
     green: 'text-green-600 dark:text-green-500',
     orange: 'text-orange-600 dark:text-orange-500',
  }

  const formatValue = () => {
    if (typeof value === 'string') return value;
    if (isCurrency) {
      return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    }
    return value.toLocaleString('es-MX');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline">
          {formatValue()}
        </div>
        <p className={cn("text-xs text-muted-foreground", descriptionColorClasses[color as keyof typeof descriptionColorClasses])}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
