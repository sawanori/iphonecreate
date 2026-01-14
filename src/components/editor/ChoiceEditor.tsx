'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

/**
 * Choice type for editor
 */
export interface EditorChoice {
  id: string;
  label: string;
  targetNodeId: string | null;
}

/**
 * Available node for targeting
 */
export interface TargetNode {
  id: string;
  title: string;
  type: string;
}

/**
 * ChoiceEditor props
 */
interface ChoiceEditorProps {
  choices: EditorChoice[];
  timeLimit: number;
  availableNodes: TargetNode[];
  currentNodeId: string;
  onChoicesChange: (choices: EditorChoice[]) => void;
  onTimeLimitChange: (timeLimit: number) => void;
}

/**
 * Choice Editor Component
 * Allows editing choices for branching video nodes
 */
export function ChoiceEditor({
  choices,
  timeLimit,
  availableNodes,
  currentNodeId,
  onChoicesChange,
  onTimeLimitChange,
}: ChoiceEditorProps) {
  const [newChoiceLabel, setNewChoiceLabel] = useState('');

  // Filter out current node from available targets
  const targetNodes = availableNodes.filter((node) => node.id !== currentNodeId);

  // Add new choice
  const handleAddChoice = () => {
    if (!newChoiceLabel.trim()) return;

    const newChoice: EditorChoice = {
      id: crypto.randomUUID(),
      label: newChoiceLabel.trim(),
      targetNodeId: null,
    };

    onChoicesChange([...choices, newChoice]);
    setNewChoiceLabel('');
  };

  // Remove choice
  const handleRemoveChoice = (choiceId: string) => {
    onChoicesChange(choices.filter((c) => c.id !== choiceId));
  };

  // Update choice label
  const handleLabelChange = (choiceId: string, label: string) => {
    onChoicesChange(
      choices.map((c) => (c.id === choiceId ? { ...c, label } : c))
    );
  };

  // Update choice target
  const handleTargetChange = (choiceId: string, targetNodeId: string | null) => {
    onChoicesChange(
      choices.map((c) => (c.id === choiceId ? { ...c, targetNodeId } : c))
    );
  };

  return (
    <div className="space-y-4">
      {/* Time Limit */}
      <div>
        <Label htmlFor="time-limit" className="text-sm font-medium">
          制限時間（秒）
        </Label>
        <Input
          id="time-limit"
          type="number"
          min={5}
          max={60}
          value={timeLimit}
          onChange={(e) => onTimeLimitChange(Number(e.target.value))}
          className="mt-1"
        />
      </div>

      {/* Choices List */}
      <div>
        <Label className="text-sm font-medium">選択肢</Label>
        <div className="mt-2 space-y-2">
          {choices.length === 0 ? (
            <p className="text-sm text-gray-500">選択肢がありません</p>
          ) : (
            choices.map((choice, index) => (
              <Card key={choice.id} className="bg-gray-50 dark:bg-gray-900">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <Input
                      value={choice.label}
                      onChange={(e) =>
                        handleLabelChange(choice.id, e.target.value)
                      }
                      placeholder="選択肢のテキスト"
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveChoice(choice.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select
                    value={choice.targetNodeId || 'none'}
                    onValueChange={(value) =>
                      handleTargetChange(
                        choice.id,
                        value === 'none' ? null : value
                      )
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="遷移先を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未設定</SelectItem>
                      {targetNodes.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.title} ({node.type === 'endNode' ? '終了' : '動画'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add New Choice */}
      <div className="flex gap-2">
        <Input
          value={newChoiceLabel}
          onChange={(e) => setNewChoiceLabel(e.target.value)}
          placeholder="新しい選択肢"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddChoice();
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddChoice}
          disabled={!newChoiceLabel.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          追加
        </Button>
      </div>

      {/* Help text */}
      {choices.length > 0 && (
        <p className="text-xs text-gray-500">
          ヒント: エッジを接続すると遷移先が自動設定されます
        </p>
      )}
    </div>
  );
}
