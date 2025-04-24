import { useState, useCallback, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TAG_COLORS } from '@/types/tags';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    TAG_COLORS.includes(color as any) ? color : null
  );
  const [pickerColor, setPickerColor] = useState(color);

  // Update all color states when color prop changes
  useEffect(() => {
    setInputValue(color);
    setPickerColor(color);
    setSelectedPreset(TAG_COLORS.includes(color as any) ? color : null);
  }, [color]);

  const handleCustomColorChange = (newColor: string) => {
    setSelectedPreset(null);
    setInputValue(newColor);
    setPickerColor(newColor);
    onChange(newColor.toUpperCase());
  };

  const handlePresetSelect = (presetColor: string) => {
    setSelectedPreset(presetColor);
    setInputValue(presetColor);
    setPickerColor(presetColor);
    onChange(presetColor);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const upperValue = value.toUpperCase();
      setPickerColor(upperValue);
      setSelectedPreset(TAG_COLORS.includes(upperValue as any) ? upperValue : null);
      onChange(upperValue);
    }
  };

  const handleInputBlur = () => {
    if (!/^#[0-9A-F]{6}$/i.test(inputValue)) {
      setInputValue(color);
      setPickerColor(color);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>プリセットカラー</Label>
        <div className="grid grid-cols-5 gap-2">
          {TAG_COLORS.map((presetColor) => (
            <Button
              key={presetColor}
              variant="outline"
              className={cn(
                "h-8 w-8 rounded-full p-0 relative",
                selectedPreset === presetColor && "ring-2 ring-primary ring-offset-2"
              )}
              style={{ backgroundColor: presetColor }}
              onClick={() => handlePresetSelect(presetColor)}
            >
              {selectedPreset === presetColor && (
                <Check className="h-4 w-4 absolute" style={{ color: getContrastTextColor(presetColor) }} />
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>カスタムカラー</Label>
        <div className="flex gap-4">
          <div className="flex-1">
            <HexColorPicker 
              color={pickerColor}
              onChange={handleCustomColorChange}
            />
          </div>
          <div className="w-24 space-y-2">
            <div 
              className="h-24 rounded-md border" 
              style={{ backgroundColor: pickerColor }}
            />
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              className="font-mono uppercase"
              maxLength={7}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to determine text color based on background
function getContrastTextColor(bgColor: string) {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}