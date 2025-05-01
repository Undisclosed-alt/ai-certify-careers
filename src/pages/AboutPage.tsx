
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About Career.AI</h1>
          <p className="text-xl text-muted-foreground">
            Reimagining professional certification with AI-powered assessments
          </p>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg mb-6">
            At Career.AI, we're on a mission to transform how professional skills are assessed and certified. By leveraging cutting-edge artificial intelligence, we provide objective, comprehensive evaluations that accurately reflect a candidate's true capabilities.
          </p>
          <p className="text-lg mb-6">
            We believe that traditional certifications often fall short in truly measuring someone's ability to succeed in a role. Our adaptive AI assessments go beyond standard questions to evaluate practical problem-solving skills, critical thinking, and real-world application of knowledge.
          </p>
          <p className="text-lg">
            We're committed to creating a fair, accessible platform that helps professionals showcase their skills and helps employers identify qualified candidates with confidence.
          </p>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 text-brand-600 mb-4">
                  <span className="text-xl font-bold">1</span>
                </div>
                <CardTitle>Select a Role</CardTitle>
                <CardDescription>
                  Choose from our range of industry-specific job roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Browse our catalog of professional certifications designed around specific job roles and skill sets that employers value.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 text-brand-600 mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <CardTitle>Take the Assessment</CardTitle>
                <CardDescription>
                  Complete an AI-powered comprehensive evaluation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Our adaptive AI generates role-specific questions combining multiple choice, open-ended responses, and practical challenges to assess your skills.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 text-brand-600 mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <CardTitle>Get Certified</CardTitle>
                <CardDescription>
                  Receive detailed feedback and your certification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Upon passing, receive your official certification along with personalized feedback on your strengths and areas for improvement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mb-16">
          <div className="bg-muted p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Our AI Technology</h2>
            <p className="text-lg mb-6">
              Our proprietary AI assessment system is built on advanced natural language processing and machine learning technologies. It evaluates not just what you know, but how you apply that knowledge in realistic scenarios.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Adaptive Testing</h3>
                <p className="text-muted-foreground">
                  Our system adapts to your responses, focusing on areas where deeper assessment is needed to provide a comprehensive evaluation.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Objective Evaluation</h3>
                <p className="text-muted-foreground">
                  Remove human bias from the certification process with our consistent, fair AI evaluation criteria.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Skill Mapping</h3>
                <p className="text-muted-foreground">
                  We map your abilities against industry standards and employer requirements to provide meaningful certifications.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Detailed Insights</h3>
                <p className="text-muted-foreground">
                  Receive personalized feedback that highlights your strengths and identifies areas for professional development.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>For Professionals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <p>Validate your skills with objective, AI-powered assessments</p>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <p>Stand out in competitive job markets with verified credentials</p>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <p>Receive personalized feedback to guide your professional development</p>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <p>Take assessments remotely at your own convenience</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>For Employers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <p>Identify candidates with verified skills matched to your needs</p>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <p>Reduce hiring risks with objective skill evaluations</p>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <p>Access detailed candidate competency profiles</p>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <p>Streamline your hiring process with pre-qualified candidates</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8">
            Join thousands of professionals who have advanced their careers with Career.AI certifications.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/jobs">
              <Button size="lg">View Certifications</Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" size="lg">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
