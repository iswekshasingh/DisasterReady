import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { leaderboardService } from '@/api/leaderboard.service';
import { LeaderboardUser } from '@/types/leaderboard.types';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';

export const LeaderboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [trainees, setTrainees] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const res = await leaderboardService.getLeaderboard();
        if (isMounted) {
          setTrainees(res.leaderboard || []);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PageContainer
      title="Trainee Readiness Standings"
      description="Competitive ranking of responders based on verified simulation points and operational readiness."
    >
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : trainees.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Trainee</TableHead>
                <TableHead>Readiness Level</TableHead>
                <TableHead>Badges</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainees.map((trainee) => {
                const isCurrentUser =
                  trainee.id === currentUser?.id || trainee.username === currentUser?.username;

                return (
                  <TableRow
                    key={trainee.id}
                    className={isCurrentUser ? 'bg-slate-50/90 font-medium ring-1 ring-inset ring-accent-blue/30' : undefined}
                  >
                    <TableCell className="text-center font-mono font-bold text-slate-700">
                      {trainee.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-navy text-white text-xs">
                          1
                        </span>
                      ) : (
                        <span>#{trainee.rank}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-mono">
                          {trainee.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900">
                              {trainee.fullName || trainee.username}
                            </span>
                            {isCurrentUser && (
                              <Badge variant="brand" size="sm">
                                You
                              </Badge>
                            )}
                          </div>
                          {trainee.fullName && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              @{trainee.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                        Level {trainee.level}
                      </span>
                    </TableCell>

                    <TableCell>
                      {trainee.badges && trainee.badges.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {trainee.badges.map((b, i) => (
                            <Badge key={i} variant="neutral" size="sm">
                              {b}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-slate-900 text-sm">
                      {trainee.totalPoints}
                      <span className="text-[11px] text-slate-400 font-normal ml-1">pts</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-16 text-center p-6">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">No Standings Recorded Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Simulations completed will award points to update this global ranking board.
            </p>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
