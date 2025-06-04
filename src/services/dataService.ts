import { supabase } from '@/integrations/supabase/client';
import { Certification, mapCertificationFromDb } from '@/types';

// TODO: Update function names from getJobRoles to getCertifications when database is migrated
export const getCertifications = async (): Promise<Certification[]> => {
  const { data, error } = await supabase
    .from('job_roles') // TODO: Rename table from job_roles to certifications
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching certifications:', error);
    throw error;
  }

  return data.map(mapCertificationFromDb);
};

export const getCertificationById = async (id: string): Promise<Certification | null> => {
  const { data, error } = await supabase
    .from('job_roles') // TODO: Rename table from job_roles to certifications
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching certification:', error);
    throw error;
  }

  return data ? mapCertificationFromDb(data) : null;
};

// Keep legacy function names for backward compatibility during transition
export const getJobRoles = getCertifications;
export const getJobRoleById = getCertificationById;
