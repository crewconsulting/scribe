import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export function SystemSettings() {
  const [settings, setSettings] = useState({
    companyName: '株式会社サンプル',
    timezone: 'Asia/Tokyo',
    language: 'ja',
    emailNotifications: true,
    slackNotifications: false,
    autoTagging: true,
    maxFileSize: 10,
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "設定を保存しました",
      description: "システム設定が正常に更新されました",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label>会社名</Label>
          <Input
            value={settings.companyName}
            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>タイムゾーン</Label>
          <Select
            value={settings.timezone}
            onValueChange={(value) => setSettings({ ...settings, timezone: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
              <SelectItem value="America/New_York">America/New_York (UTC-4)</SelectItem>
              <SelectItem value="Europe/London">Europe/London (UTC+1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>言語</Label>
          <Select
            value={settings.language}
            onValueChange={(value) => setSettings({ ...settings, language: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>メール通知</Label>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Slack通知</Label>
            <Switch
              checked={settings.slackNotifications}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, slackNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>自動タグ付け</Label>
            <Switch
              checked={settings.autoTagging}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, autoTagging: checked })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>最大ファイルサイズ (MB)</Label>
          <Input
            type="number"
            value={settings.maxFileSize}
            onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        設定を保存
      </Button>
    </div>
  );
}