export interface Version {
  id: string;
  type: 'release' | 'snapshot' | 'other';
  url: string;
  source: 'mojang' | 'nixinova';
  recommendedJava?: number;
}

export const fetchVersions = async (): Promise<Version[]> => {
  try {
    const versions = await window.api.getVersions();
    return versions.map((version) => ({ ...version, url: '', source: 'mojang' }));
  } catch (error) {
    console.error('Error fetching versions:', error);
    return [];
  }
};
