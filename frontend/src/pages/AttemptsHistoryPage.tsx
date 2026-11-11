import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Clock,
  ArrowRight,
  Search,
} from 'lucide-react';
import { attemptService } from '@/api/attempt.service';
import { AttemptHistoryItem } from '@/types/attempt.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';

export const AttemptsHistoryPage: React.FC = () => {
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchAttempts = async () => {
      try {
        setIsLoading(true);
        const res = await attemptService.getAttemptHistory();
        if (isMounted) {
          setAttempts(res.attempts || []);
        }
      } catch (err) {
        console.error('Failed to load attempt history:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAttempts();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAttempts = attempts.filter((att) => {
    const titleMatch = (att.scenario?.title || 'Scenario')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const passStatus = att.score >= 70 ? 'PASSED' : 'FAILED';
    const statusMatch =
      statusFilter === 'ALL' ||
      (statusFilter === 'PASSED' && passStatus === 'PASSED') ||
      (statusFilter === 'FAILED' && passStatus === 'FAILED');
    return titleMatch && statusMatch;
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer
      title="Trainee Attempt History"
      description="Permanent audit trail of all emergency simulations attempted, performance scores, and competency evaluations."
      action={
        <Link to="/scenarios">
          <Button variant="primary" size="sm">
            Launch New Simulation
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
            placeholder="Search history by scenario title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-blue focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-accent-blue focus:bg-white"
          >
            <option value="ALL">All Outcomes</option>
            <option value="PASSED">Passed (≥70%)</option>
            <option value="FAILED">Failed (&lt;70%)</option>
          </select>
        </div>
      </div>

      {/* Attempts Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredAttempts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario Name</TableHead>
                <TableHead>Disaster Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttempts.map((att) => {
                const isPassed = att.score >= 70;
                return (
                  <TableRow key={att.id}>
                    <TableCell className="font-medium text-slate-900">
                      {att.scenario?.title || 'Emergency Scenario'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500 uppercase">
                      {att.scenario?.disasterType?.replace(/_/g, ' ') || 'OTHER'}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-slate-800">
                      {att.score}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={isPassed ? 'success' : 'danger'} size="sm">
                        {isPassed ? 'Passed' : 'Failed'}
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
                        <Button variant="ghost" size="sm" className="h-7 text-accent-blue font-sans">
                          Inspect <ArrowRight className="w-3 h-3 ml-1" />
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
            <p className="text-sm font-medium text-slate-800">No Simulation Records Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Completed simulations will automatically show in this audit table along with AI competency reviews.
            </p>
            <Link to="/scenarios" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                Explore Available Scenarios
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
