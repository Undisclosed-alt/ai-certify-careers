
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { JobRole } from '@/types';
import { getJobRoles } from '@/services/dataService';

const JobListPage = () => {
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const roles = await getJobRoles();
        setJobRoles(roles);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch job roles:', error);
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
          Select a job role to get certified and validate your skills with our AI-powered assessments.
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
            <Card key={role.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={role.imageUrl} 
                  alt={role.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{role.title}</h3>
                  <span className="text-sm bg-brand-100 text-brand-700 py-1 px-2 rounded-full">
                    {role.level}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{role.description}</p>
                <div className="flex items-center justify-between">
                  {role.price_cents === 0 ? (
                    <span className="font-semibold text-lg text-green-600">Free</span>
                  ) : (
                    <span className="font-semibold text-lg">${(role.price_cents / 100).toFixed(2)}</span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/jobs/${role.id}`} className="w-full">
                  <Button className="w-full">
                    {role.price_cents === 0 ? 'Start Exam' : 'View Details'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No job roles found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default JobListPage;
