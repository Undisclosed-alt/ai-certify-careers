
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        
        <div className="mb-8">
          <p className="text-muted-foreground mb-4">
            Last updated: May 1, 2023
          </p>
          <p className="mb-4">
            Please read these Terms and Conditions ("Terms") carefully before using the Career.AI certification platform operated by Career.AI Inc. ("us", "we", or "our").
          </p>
          <p className="mb-4">
            Your access to and use of the service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the service.
          </p>
          <p className="mb-4">
            By accessing or using the service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">1. Accounts</h2>
          <p className="mb-4">
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
          </p>
          <p className="mb-4">
            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password, whether your password is with our service or a third-party service.
          </p>
          <p className="mb-4">
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">2. Certification Process and Exams</h2>
          <p className="mb-4">
            The certifications provided by Career.AI are designed to test and validate professional skills in specific certifications. By taking our exams, you agree to the following:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You will not share exam questions, answers, or content with any third party</li>
            <li>You will complete the exams honestly and without assistance from others</li>
            <li>You acknowledge that exam results are determined by our AI evaluation system</li>
            <li>Certification results may be used by Career.AI for research and improvement purposes</li>
            <li>We reserve the right to revoke certifications in cases of fraudulent behavior</li>
          </ul>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">3. Payment and Refunds</h2>
          <p className="mb-4">
            By purchasing a certification exam, you agree to pay the specified fees. All payments are processed securely through our payment processors.
          </p>
          <p className="mb-4">
            Our refund policy is as follows:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Full refunds are available if requested before starting an exam</li>
            <li>No refunds are provided once an exam has been started</li>
            <li>Technical issues preventing exam completion may qualify for a retake or refund at our discretion</li>
          </ul>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">4. Data Collection and Privacy</h2>
          <p className="mb-4">
            Career.AI collects personal information as described in our Privacy Policy. By using our service, you consent to such collection and processing as described therein.
          </p>
          <p className="mb-4">
            We may use anonymized exam data and results to improve our AI algorithms and certification processes. This data will not be tied to your personal identity when used for research purposes.
          </p>
          <p className="mb-4">
            For more details on how we handle your data, please refer to our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">5. Intellectual Property</h2>
          <p className="mb-4">
            The service and its original content, features, and functionality are and will remain the exclusive property of Career.AI Inc. and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          </p>
          <p className="mb-4">
            You may not copy, modify, create derivative works from, publicly display, publicly perform, republish, or transmit any of the material from our service without prior written consent.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">6. Certification Validity</h2>
          <p className="mb-4">
            Certifications issued by Career.AI are valid as of the date of issuance. We do not guarantee that employers or other institutions will recognize or accept our certifications.
          </p>
          <p className="mb-4">
            Certifications are issued to individuals and may not be transferred to other persons or entities. You may display and share your certification status as provided by our platform.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">7. Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
          <p className="mb-4">
            Upon termination, your right to use the service will immediately cease. If you wish to terminate your account, you may simply discontinue using the service or contact us to request account deletion.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">8. Limitation of Liability</h2>
          <p className="mb-4">
            In no event shall Career.AI Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">9. Changes</h2>
          <p className="mb-4">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
          <p className="mb-4">
            By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the service.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">10. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at terms@career.ai.
          </p>
        </div>
        
        <div className="flex justify-center mt-12">
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
