'use client';

import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '~convex/_generated/api';

import { Settings01Icon, Refresh01Icon, PencilEdit01Icon, CheckmarkBadge01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemConfigPage() {
  const configs = useQuery(api.admin.getAllConfig);
  const updateConfig = useMutation(api.admin.updateConfig);
  const resetConfig = useMutation(api.admin.resetConfig);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (configs === undefined) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-96' />
        <div className='mt-8 grid gap-6'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-32 rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  const handleEdit = (key: string, value: any) => {
    setEditingKey(key);
    setEditValue(String(value));
  };

  const handleSave = async (key: string) => {
    setIsUpdating(true);
    try {
      const numValue = Number(editValue);
      const finalValue = isNaN(numValue) || editValue === '' ? editValue : numValue;
      
      await updateConfig({ key, value: finalValue });
      setEditingKey(null);
    } catch (err) {
      console.error('Failed to update config', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async (key: string) => {
    if (confirm('Are you sure you want to reset this setting to its default value?')) {
      await resetConfig({ key });
      setEditingKey(null);
    }
  };

  // Group configs by category
  const categories = configs.reduce((acc, config) => {
    const cat = config.category ?? 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(config);
    return acc;
  }, {} as Record<string, typeof configs>);

  return (
    <div className='stagger-children space-y-8 max-w-4xl'>
      <div>
        <p className='text-sm text-muted-foreground'>
          Manage global platform parameters, tax benchmarking rates, and system thresholds. 
          Changes here immediately affect new tax calculations and background sync processes.
        </p>
      </div>

      {Object.entries(categories).map(([category, items]) => (
        <Card key={category} className='overflow-hidden'>
          <CardHeader className='border-b border-border/40 bg-muted/20 px-6 py-4'>
            <CardTitle className='text-base font-semibold'>{category}</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='divide-y divide-border/40'>
              {items.map((config) => (
                <div key={config.key} className='flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 hover:bg-muted/10 transition-colors'>
                  <div className='flex-1 pr-4'>
                    <div className='flex items-center gap-2'>
                      <Label className='text-sm font-semibold'>{config.label ?? config.key}</Label>
                      {config.isCustom && (
                        <span className='inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary'>
                          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={10} />
                          Custom
                        </span>
                      )}
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground leading-relaxed'>{config.description}</p>
                    <p className='mt-2 font-mono text-[10px] text-muted-foreground/60'>Key: {config.key}</p>
                  </div>

                  <div className='flex items-center gap-3 sm:w-72 shrink-0'>
                    {editingKey === config.key ? (
                      <div className='flex w-full items-center gap-2'>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className='h-8 font-mono text-sm'
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(config.key);
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                        />
                        <Button 
                          size='sm' 
                          onClick={() => handleSave(config.key)} 
                          disabled={isUpdating}
                        >
                          Save
                        </Button>
                        <Button 
                          size='sm' 
                          variant='ghost' 
                          onClick={() => setEditingKey(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className='flex w-full items-center justify-between rounded-md border border-border/60 bg-background px-3 py-1.5'>
                        <span className='font-mono text-sm font-medium'>
                          {String(config.value)}
                        </span>
                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={() => handleEdit(config.key, config.value)}
                            title='Edit value'
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} size={14} className='text-muted-foreground hover:text-foreground' />
                          </Button>
                          {config.isCustom && (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6'
                              onClick={() => handleReset(config.key)}
                              title='Reset to default'
                            >
                              <HugeiconsIcon icon={Refresh01Icon} size={14} className='text-muted-foreground hover:text-destructive' />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
