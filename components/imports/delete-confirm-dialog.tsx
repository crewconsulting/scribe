'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isProcessing,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>インポートデータの削除</DialogTitle>
          <DialogDescription>
            このインポートデータと関連する全ての取引データを削除します。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            削除したデータは復元できません。
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isProcessing}
            >
              削除する
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}