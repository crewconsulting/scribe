'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { ChevronsUpDown, Check, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useState } from 'react';
import { TAG_CATEGORIES } from '@/types/tags';
import { masterTags, initialUserTags } from '@/lib/mock-data/tags';

interface TagSelectProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: string[];
}

export function TagSelect({ selectedTags, onTagsChange, availableTags }: TagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  // タグをカテゴリごとにグループ化
  const groupedTags = TAG_CATEGORIES.map(category => ({
    category,
    tags: availableTags.filter(tag => {
      const masterTag = masterTags.find(t => t.name === tag);
      const userTag = initialUserTags.find(t => t.name === tag);
      const tagCategory = (masterTag || userTag)?.category;
      return tagCategory === category;
    })
  })).filter(group => group.tags.length > 0);

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        className={cn(
          'w-[300px] justify-between',
          !selectedTags.length && 'text-muted-foreground'
        )}
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.length > 0
          ? `${selectedTags.length}個のタグを選択中`
          : 'タグを選択'}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-2xl">タグを選択</DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* カテゴリリスト */}
            <div className="w-[240px] border-r">
              <ScrollArea className="h-full">
                {groupedTags.map((group) => (
                  <Button
                    key={group.category}
                    variant="ghost"
                    className="w-full justify-start px-6 py-4 h-auto"
                  >
                    <div>
                      <div className="font-medium text-lg">{group.category}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {group.tags.length}個のタグ
                      </div>
                    </div>
                  </Button>
                ))}
              </ScrollArea>
            </div>

            {/* タグリスト */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-10">
                  {groupedTags.map((group) => (
                    <div key={group.category} className="space-y-4">
                      <h3 className="font-medium text-xl sticky top-0 bg-background py-2 border-b">
                        {group.category}
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {group.tags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          const tagData = masterTags.find(t => t.name === tag) || 
                                        initialUserTags.find(t => t.name === tag);
                          
                          return (
                            <Button
                              key={tag}
                              variant={isSelected ? "secondary" : "outline"}
                              className={cn(
                                "justify-start h-14 px-4 relative overflow-hidden transition-all duration-200",
                                isSelected && "ring-2 ring-primary ring-offset-2"
                              )}
                              style={{
                                backgroundColor: isSelected ? tagData?.color : undefined,
                                color: isSelected ? getContrastColor(tagData?.color) : undefined,
                              }}
                              onClick={() => {
                                onTagsChange(
                                  isSelected
                                    ? selectedTags.filter((t) => t !== tag)
                                    : [...selectedTags, tag]
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-3 h-5 w-5 flex-shrink-0 transition-opacity duration-200',
                                  isSelected ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="text-lg truncate">{tag}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* 選択済みタグ */}
              {selectedTags.length > 0 && (
                <div className="border-t p-6 bg-muted/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-medium">選択中のタグ</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-muted-foreground hover:text-destructive"
                      onClick={() => onTagsChange([])}
                    >
                      すべて解除
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => {
                      const tagData = masterTags.find(t => t.name === tag) || 
                                    initialUserTags.find(t => t.name === tag);
                      return (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1 px-4 py-2 text-base"
                          style={{
                            backgroundColor: tagData?.color,
                            color: getContrastColor(tagData?.color),
                          }}
                        >
                          {tag}
                          <X
                            className="h-4 w-4 cursor-pointer hover:opacity-75 transition-opacity ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTagsChange(selectedTags.filter((t) => t !== tag));
                            }}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to determine contrast color
function getContrastColor(bgColor?: string) {
  if (!bgColor) return undefined;
  
  // Convert hex to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}