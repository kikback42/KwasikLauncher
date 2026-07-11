export interface Version {
  id: string;
  type: 'release' | 'snapshot' | 'other';
  url: string;
  source: 'mojang' | 'nixinova';
  recommendedJava?: number;
}

export const fetchVersions = async (): Promise<Version[]> => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return [
      { id: '1.21.5', type: 'release', url: '', source: 'mojang', recommendedJava: 21 },
      { id: '1.20.1', type: 'release', url: '', source: 'mojang', recommendedJava: 17 },
      { id: '1.21.5-fabric', type: 'other', url: '', source: 'nixinova', recommendedJava: 21 },
    ];
  } catch (error) {
    console.error('Error fetching versions:', error);
    return [];
  }
};
