import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Clock, ArrowRight, Search } from 'lucide-react';
import { attemptApi } from '@/api/attempts';
import { AttemptHistoryItem } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
} from '@/components/ui/Table';

export const HistoryPage: React.FC = () => {
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    attemptApi.getHistory().then((data) => {
      if (active) {
        setAttempts(data);
        setIsLoading(false);
      }
    }).catch(() => {
      if (active) setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = attempts.filter((att) => {
    const title = (att.scenario?.title || 'Emergency Drill').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const passed = att.score >= 70;
    const matchFilter =
      filter === 'ALL' ||
      (filter === 'PASSED' && passed) ||
      (filter === 'FAILED' && !passed);
    return matchSearch && matchFilter;
  });

  const formatDuration = (seconds?: number | null) => {
    if (!seconds && seconds !== 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer
      title="Trainee Attempt Log"
      description="Immutable operational record of all completed simulated response assessments and scoring benchmarks."
      action={
        <Link to="/">
          <Button variant="primary" size="sm">
            Launch 2D Simulation
          </Button>
        </Link>
      }
    >
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search records by scenario title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white transition-colors"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-brand-blue focus:bg-white"
        >
          <option value="ALL">All Outcomes</option>
          <option value="PASSED">Passed (≥70%)</option>
          <option value="FAILED">Failed (&lt;70%)</option>
        </select>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario Drill</TableHead>
                <TableHead>Disaster</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-right">Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((att) => {
                const passed = att.score >= 70;
                return (
                  <TableRow key={att.id}>
                    <TableCell className="font-medium text-slate-900">
                      {att.scenario?.title || 'Emergency Drill'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500 uppercase">
                      {att.scenario?.disasterType || 'OTHER'}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-slate-900">
                      {att.score}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={passed ? 'success' : 'danger'} size="sm">
                        {passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-slate-500 text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDuration(att.timeSpent)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-slate-500 text-[11px]">
                      {formatDate(att.completedAt || att.startedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/attempts/${att.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-brand-blue font-sans">
                          Review <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-16 text-center p-6">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">No Attempt Records Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Simulations completed in the browser or via Unity client will log automatically here.
            </p>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

