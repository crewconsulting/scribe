import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus } from "lucide-react";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { User } from "@/types/admin";
import { useToast } from "@/components/ui/use-toast";

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = (userId: string, newRole: string) => {
    toast({
      title: "ユーザー権限を更新しました",
      description: `ユーザーID: ${userId}の権限を${newRole}に変更しました`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ユーザーを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          ユーザーを招待
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名前</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>権限</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>最終ログイン</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status === 'active' ? '有効' : '無効'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理者</SelectItem>
                      <SelectItem value="user">一般ユーザー</SelectItem>
                      <SelectItem value="viewer">閲覧のみ</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), 'yyyy年MM月dd日', { locale: ja })}
                </TableCell>
                <TableCell>
                  {user.lastLoginAt ? 
                    format(new Date(user.lastLoginAt), 'yyyy年MM月dd日 HH:mm', { locale: ja }) :
                    'なし'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}