import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Target, ArrowRight, ShieldAlert } from 'lucide-react';
import { scenarioApi } from '@/api/scenarios';
import { Scenario } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Table';

export const ScenariosPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    scenarioApi.getAll().then((data) => {
      if (active) {
        setScenarios(data);
        setIsLoading(false);
      }
    }).catch(() => {
      if (active) setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = scenarios.filter((sc) => {
    const matchesSearch =
      sc.title.toLowerCase().includes(search.toLowerCase()) ||
      sc.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || sc.disasterType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <PageContainer
      title="Disaster Training Scenarios"
      description="Select an emergency simulation module to practice protocol decisions and measure real-time survival readiness."
    >
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search scenarios by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white transition-colors"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-brand-blue focus:bg-white"
        >
          <option value="ALL">All Disaster Types</option>
          <option value="EARTHQUAKE">Earthquake</option>
          <option value="FLOOD">Flood</option>
          <option value="FIRE">Fire</option>
          <option value="TSUNAMI">Tsunami</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((sc) => (
            <Card
              key={sc.id}
              className="flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    {sc.disasterType}
                  </span>
                  <Badge variant="brand" size="sm">
                    {sc.difficulty}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                  {sc.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {sc.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {sc.estimatedDuration ?? 5}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-slate-400" />
                    Pass: {sc.passingScore}%
                  </span>
                </div>

                <Link to={`/scenarios/${sc.id}`}>
                  <Button variant="secondary" size="sm">
                    Briefing <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-lg bg-white p-8">
          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">No Matching Scenarios</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or resetting filters.
          </p>
        </div>
      )}
    </PageContainer>
  );
};
