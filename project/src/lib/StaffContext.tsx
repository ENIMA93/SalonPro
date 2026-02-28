import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, type Staff as StaffType } from './supabase';

interface StaffContextType {
  staff: StaffType[];
  loading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  addStaff: (newStaff: StaffType) => void;
  updateStaff: (updatedStaff: StaffType) => void;
  removeStaff: (staffId: string) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}

interface StaffProviderProps {
  children: ReactNode;
}

export function StaffProvider({ children }: StaffProviderProps) {
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchStaff = async () => {
    console.log('[StaffContext] fetchStaff called');
    setError(null);
    
    try {
      // Force session refresh to ensure we have valid auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[StaffContext] Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session) {
        console.warn('[StaffContext] No session, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('[StaffContext] Refresh error:', refreshError);
          throw new Error(`Authentication expired: ${refreshError.message}`);
        }
      }

      // Fetch staff data with a timestamp to prevent caching
      const timestamp = Date.now();
      console.log('[StaffContext] Fetching staff data at', timestamp);
      
      const { data, error: fetchError } = await supabase
        .from('staff')
        .select('*')
        .order('name');
      
      if (fetchError) {
        console.error('[StaffContext] Fetch error:', fetchError);
        if (fetchError.code === 'PGRST116' || fetchError.message?.includes('row-level security')) {
          throw new Error(`Access denied: Please refresh the page. (${fetchError.message})`);
        }
        throw new Error(`${fetchError.message} (Code: ${fetchError.code || 'unknown'})`);
      }
      
      console.log('[StaffContext] Fetched staff:', { count: data?.length ?? 0, data: data?.slice(0, 3) });
      const staffData = data ?? [];
      setStaff(staffData);
      
      // Backup to localStorage for persistence across navigation
      try {
        localStorage.setItem('salon_staff_backup', JSON.stringify({
          data: staffData,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.warn('[StaffContext] Failed to backup staff to localStorage:', err);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[StaffContext] Error in fetchStaff:', err);
      setError(errorMessage);
      // Don't clear staff data on error - keep showing what we have
    }
  };

  const refreshStaff = async () => {
    console.log('[StaffContext] refreshStaff called - forcing reload');
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      await fetchStaff();
    } catch (err) {
      console.error('[StaffContext] refreshStaff error:', err);
      // fetchStaff already sets the error, so we don't need to set it again
    } finally {
      setLoading(false);
    }
  };

  const addStaff = (newStaff: StaffType) => {
    console.log('[StaffContext] Adding staff to local state:', newStaff.name);
    setStaff(prev => {
      // Check if staff already exists to prevent duplicates
      const exists = prev.some(s => s.id === newStaff.id);
      if (exists) {
        console.log('[StaffContext] Staff already exists, updating instead of adding');
        return prev.map(s => s.id === newStaff.id ? newStaff : s);
      }
      return [...prev, newStaff];
    });
  };

  const updateStaff = (updatedStaff: StaffType) => {
    console.log('[StaffContext] Updating staff in local state:', updatedStaff.name);
    setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
  };

  const removeStaff = (staffId: string) => {
    console.log('[StaffContext] Removing staff from local state:', staffId);
    setStaff(prev => prev.filter(s => s.id !== staffId));
  };

  // Initialize staff data when the context is first created
  useEffect(() => {
    let isMounted = true;
    
    if (!initialized) {
      console.log('[StaffContext] Initializing staff context');
      setInitialized(true);
      
      // Clear any potentially corrupted localStorage backup
      try {
        localStorage.removeItem('salon_staff_backup');
        console.log('[StaffContext] Cleared localStorage backup to prevent duplication');
      } catch (err) {
        console.warn('[StaffContext] Failed to clear localStorage backup:', err);
      }
      
      // Fetch data immediately, but only if component is still mounted
      const initializeData = async () => {
        if (isMounted) {
          await refreshStaff();
        }
      };
      
      initializeData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialized]);

  // Refresh data when window regains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[StaffContext] Window focused, refreshing staff data');
      refreshStaff();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const value: StaffContextType = {
    staff,
    loading,
    error,
    fetchStaff,
    refreshStaff,
    addStaff,
    updateStaff,
    removeStaff,
  };

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
}