import { apiClient } from './client';
import { Scenario } from '@/types';

export const scenarioApi = {
  async getAll(): Promise<Scenario[]> {
    const { data } = await apiClient.get<{ success: boolean; count: number; scenarios: Scenario[] }>(
      '/scenarios'
    );
    return data.scenarios || [];
  },

  async getById(id: string): Promise<Scenario> {
    const { data } = await apiClient.get<{ success: boolean; scenario: Scenario }>(
      `/scenarios/${id}`
    );
    return data.scenario;
  },
};
