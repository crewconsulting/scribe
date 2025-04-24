'use client';

import { useState } from 'react';
import { Sidebar } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserList } from "@/components/admin/user-list";
import { SystemSettings } from "@/components/admin/system-settings";
import { ActivityLog } from "@/components/admin/activity-log";
import { mockUsers, mockActivityLogs } from "@/lib/mock-data/admin";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">管理画面</h1>
            <p className="text-muted-foreground">
              ユーザー管理とシステム設定
            </p>
          </div>

          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="users">ユーザー管理</TabsTrigger>
                <TabsTrigger value="settings">システム設定</TabsTrigger>
                <TabsTrigger value="activity">アクティビティログ</TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <UserList users={mockUsers} />
              </TabsContent>

              <TabsContent value="settings">
                <SystemSettings />
              </TabsContent>

              <TabsContent value="activity">
                <ActivityLog logs={mockActivityLogs} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}