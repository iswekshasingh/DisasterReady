import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Clock,
  Target,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { scenarioService } from '@/api/scenario.service';
import { ScenarioListItem, DisasterType, DifficultyLevel } from '@/types/scenario.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export const ScenariosPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchScenarios = async () => {
      try {
        setIsLoading(true);
        const res = await scenarioService.getScenarios();
        if (isMounted) {
          setScenarios(res.scenarios || []);
        }
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchScenarios();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredScenarios = scenarios.filter((sc) => {
    const matchesSearch =
      sc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || sc.disasterType === selectedType;
    const matchesDifficulty =
      selectedDifficulty === 'ALL' || sc.difficulty === selectedDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });

  const disasterTypes: Array<{ label: string; value: string }> = [
    { label: 'All Disasters', value: 'ALL' },
    { label: 'Earthquake', value: 'EARTHQUAKE' },
    { label: 'Flood', value: 'FLOOD' },
    { label: 'Fire', value: 'FIRE' },
    { label: 'Tsunami', value: 'TSUNAMI' },
    { label: 'Cyclone', value: 'CYCLONE' },
    { label: 'Landslide', value: 'LANDSLIDE' },
    { label: 'Chemical Spill', value: 'CHEMICAL_SPILL' },
  ];

  const difficultyLevels: Array<{ label: string; value: string }> = [
    { label: 'All Levels', value: 'ALL' },
    { label: 'Easy', value: 'EASY' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Hard', value: 'HARD' },
    { label: 'Expert', value: 'EXPERT' },
  ];

  const getDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'EASY':
        return <Badge variant="success">Easy</Badge>;
      case 'MEDIUM':
        return <Badge variant="brand">Medium</Badge>;
      case 'HARD':
        return <Badge variant="warning">Hard</Badge>;
      case 'EXPERT':
        return <Badge variant="danger">Expert</Badge>;
      default:
        return <Badge variant="neutral">{diff}</Badge>;
    }
  };

  const getDisasterLabel = (type: DisasterType) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <PageContainer
      title="Disaster Training Scenarios"
      description="Standardized emergency preparedness modules. Complete simulated response situations to evaluate personal decision-making under stress."
    >
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search scenarios by title or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-blue focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Disaster Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-accent-blue focus:bg-white"
          >
            {disasterTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-accent-blue focus:bg-white"
          >
            {difficultyLevels.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : filteredScenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScenarios.map((sc) => (
            <Card
              key={sc.id}
              className="flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    {getDisasterLabel(sc.disasterType)}
                  </span>
                  {getDifficultyBadge(sc.difficulty)}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 tracking-tight leading-snug">
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
                    {sc.estimatedDuration ?? 5} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-slate-400" />
                    Pass: {sc.passingScore}%
                  </span>
                </div>

                <Link to={`/scenarios/${sc.id}`}>
                  <Button variant="secondary" size="sm">
                    Inspect <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-lg bg-white p-8">
          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">No Matching Scenarios Found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or reset the filters to see all available disaster response modules.
          </p>
          {(searchTerm || selectedType !== 'ALL' || selectedDifficulty !== 'ALL') && (
            <Button
              variant="subtle"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('ALL');
                setSelectedDifficulty('ALL');
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </PageContainer>
  );
};
