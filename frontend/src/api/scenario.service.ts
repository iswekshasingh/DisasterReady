import { apiClient } from './client';
import {
  ScenarioDetailResponse,
  ScenariosListResponse,
} from '@/types/scenario.types';

export const scenarioService = {
  async getScenarios(): Promise<ScenariosListResponse> {
    const { data } = await apiClient.get<ScenariosListResponse>('/scenarios');
    return data;
  },

  async getScenarioById(id: string): Promise<ScenarioDetailResponse> {
    const { data } = await apiClient.get<ScenarioDetailResponse>(`/scenarios/${id}`);
    return data;
  },
};
