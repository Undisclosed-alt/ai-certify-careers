
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Certification } from '@/types';
import { getCertifications } from '@/services/dataService';
import { CertificationCard } from '@/components/CertificationCard';

const CertificationListPage = () => {
  const [jobRoles, setJobRoles] = useState<Certification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const roles = await getCertifications();
        setJobRoles(roles);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch certifications:', error);
        setIsLoading(false);
      }
    };

    fetchJobRoles();
  }, []);

  const filteredJobRoles = jobRoles.filter(role =>
    role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Professional Certification Exams
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Select a certification to get certified and validate your skills with our AI-powered assessments.
        </p>
        <div className="max-w-md mx-auto">
          <Input
            type="text"
            placeholder="Search by job title or level..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : filteredJobRoles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobRoles.map((role) => (
            <CertificationCard key={role.id} jobRole={role} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No certifications found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default CertificationListPage;
