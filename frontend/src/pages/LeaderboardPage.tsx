import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { leaderboardApi } from '@/api/leaderboard';
import { LeaderboardEntry } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
} from '@/components/ui/Table';

export const LeaderboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    leaderboardApi.getTop().then((list) => {
      if (active) {
        setEntries(list);
        setIsLoading(false);
      }
    }).catch(() => {
      if (active) setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageContainer
      title="Trainee Readiness Standings"
      description="Global rankings based on verified disaster response simulation scores and competency points."
    >
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Trainee Responder</TableHead>
                <TableHead>Operational Tier</TableHead>
                <TableHead>Badges</TableHead>
                <TableHead className="text-right">Total Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const isCurrent =
                  entry.id === currentUser?.id || entry.username === currentUser?.username;

                return (
                  <TableRow
                    key={entry.id}
                    className={isCurrent ? 'bg-brand-blue-subtle/50 font-medium' : undefined}
                  >
                    <TableCell className="text-center font-mono font-bold text-slate-700">
                      {entry.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-navy text-white text-xs">
                          1
                        </span>
                      ) : (
                        <span>#{entry.rank}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-mono font-bold">
                          {entry.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              {entry.fullName || entry.username}
                            </span>
                            {isCurrent && (
                              <Badge variant="brand" size="sm">
                                You
                              </Badge>
                            )}
                          </div>
                          {entry.fullName && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              @{entry.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                        Tier {entry.level}
                      </span>
                    </TableCell>

                    <TableCell>
                      {entry.badges && entry.badges.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.badges.map((b, idx) => (
                            <Badge key={idx} variant="neutral" size="sm">
                              {b}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-slate-900 text-sm">
                      {entry.totalPoints}
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
