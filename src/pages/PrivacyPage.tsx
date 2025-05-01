
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="mb-8">
          <p className="text-muted-foreground mb-4">
            Last updated: May 1, 2023
          </p>
          <p className="mb-4">
            Career.AI Inc. ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Career.AI.
          </p>
          <p className="mb-4">
            This Privacy Policy applies to our website, and its associated subdomains (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information from you when you register on our website, take a certification exam, fill out a form, or otherwise interact with our Service.
          </p>
          <p className="mb-4">
            The categories of information we collect can include:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Personal Information:</strong> Such as your name, email address, and professional background.</li>
            <li><strong>Certification Data:</strong> Your responses to exam questions, scores, and results.</li>
            <li><strong>Payment Information:</strong> Credit card details or other payment information (processed securely through our payment processors).</li>
            <li><strong>Usage Data:</strong> Information on how you use our Service, including browser type, IP address, device information, and pages visited.</li>
          </ul>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect in various ways, including to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Provide, operate, and maintain our Service</li>
            <li>Process and complete certification exams and assessments</li>
            <li>Generate and issue certification credentials</li>
            <li>Improve, personalize, and expand our Service</li>
            <li>Understand and analyze how you use our Service</li>
            <li>Develop new products, services, features, and functionality</li>
            <li>Communicate with you about our Service, updates, security alerts, and support</li>
            <li>Process your payments</li>
            <li>Improve our AI algorithms and assessment technology (using anonymized data)</li>
          </ul>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">3. Sharing of Your Information</h2>
          <p className="mb-4">
            We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>With your Consent:</strong> We may disclose your information with your consent to comply with legal requirements or to fulfill the purposes for which you provided it.
            </li>
            <li>
              <strong>With Service Providers:</strong> We may share your information with third-party vendors and service providers that perform services for us or on our behalf, such as payment processing and data analysis.
            </li>
            <li>
              <strong>Certification Verification:</strong> With your permission, we may share your certification status and credentials with potential employers or other parties for verification purposes.
            </li>
            <li>
              <strong>For Legal Reasons:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.
            </li>
          </ul>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except as described above.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">4. Storage and Protection of Your Information</h2>
          <p className="mb-4">
            We use administrative, technical, and physical security measures to help protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          <p className="mb-4">
            Your data is stored on secure servers and we limit access to your information to authorized personnel only. We retain your information for as long as your account is active or as needed to provide you with our services, comply with legal obligations, resolve disputes, and enforce our agreements.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">5. Your Data Protection Rights</h2>
          <p className="mb-4">
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>The right to access the personal information we have about you</li>
            <li>The right to request the correction of inaccurate personal information</li>
            <li>The right to request the deletion of your personal information</li>
            <li>The right to withdraw consent at any time, where we relied on your consent to process your information</li>
            <li>The right to request restrictions on the processing of your data</li>
            <li>The right to data portability (receiving a copy of your personal data)</li>
          </ul>
          <p className="mb-4">
            To exercise these rights, please contact us at privacy@career.ai.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">6. Cookies and Tracking Technologies</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
          </p>
          <p className="mb-4">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">7. Children's Privacy</h2>
          <p className="mb-4">
            Our Service is not directed to children under the age of 13, and we do not knowingly collect personal information from children under the age of 13. If we learn that we have collected personal information from a child under the age of 13, we will promptly delete that information.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">8. Changes to This Privacy Policy</h2>
          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
          <p className="mb-4">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">9. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at privacy@career.ai.
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

export default PrivacyPage;
