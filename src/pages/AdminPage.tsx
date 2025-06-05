
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CertificationsTab from "@/components/admin/CertificationsTab";
import ExamsQuestionsTab from "@/components/admin/ExamsQuestionsTab";
import UsersSubscriptionsTab from "@/components/admin/UsersSubscriptionsTab";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("job-roles");

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="job-roles">Certifications</TabsTrigger>
          <TabsTrigger value="exams-questions">Exams & Questions</TabsTrigger>
          <TabsTrigger value="users-subscriptions">Users & Subscriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="job-roles" className="mt-6">
          <CertificationsTab />
        </TabsContent>
        
        <TabsContent value="exams-questions" className="mt-6">
          <ExamsQuestionsTab />
        </TabsContent>
        
        <TabsContent value="users-subscriptions" className="mt-6">
          <UsersSubscriptionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
