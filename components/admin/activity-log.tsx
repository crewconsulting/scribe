import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ActivityLog as ActivityLogType } from "@/types/admin";

interface ActivityLogProps {
  logs: ActivityLogType[];
}

const ACTION_COLORS = {
  create: 'default',
  update: 'secondary',
  delete: 'destructive',
  login: 'outline',
} as const;

export function ActivityLog({ logs }: ActivityLogProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>ユーザー</TableHead>
            <TableHead>アクション</TableHead>
            <TableHead>詳細</TableHead>
            <TableHead>IPアドレス</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {format(new Date(log.timestamp), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}
              </TableCell>
              <TableCell>{log.user}</TableCell>
              <TableCell>
                <Badge variant={ACTION_COLORS[log.action]}>
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell>{log.details}</TableCell>
              <TableCell className="font-mono">{log.ipAddress}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}