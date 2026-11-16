export type AppView = 
  | 'home' 
  | 'select' 
  | 'scan' 
  | 'manual' 
  | 'url-import' 
  | 'validate' 
  | 'solution' 
  | 'settings';

export interface NavItem {
  id: AppView;
  label: string;
  badge?: string;
}
