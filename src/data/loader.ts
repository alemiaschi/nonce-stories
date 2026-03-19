import storiesData from '../../data/stories_data.json';
import type { AppData } from '../types';

export function getAppData(): AppData {
  return storiesData as AppData;
}
