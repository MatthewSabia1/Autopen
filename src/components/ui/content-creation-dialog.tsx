import React from "react";
import { X, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "./dialog";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";

interface ContentType {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface ContentCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  contentTypes: ContentType[];
  onCreateContent: (data: {
    title: string;
    description: string;
    contentType: string;
  }) => void;
}

export function ContentCreationDialog({
  open,
  onOpenChange,
  trigger,
  contentTypes,
  onCreateContent,
}: ContentCreationDialogProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [contentType, setContentType] = React.useState(contentTypes[0]?.id || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateContent({
      title,
      description,
      contentType,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="content-creation-modal sm:max-w-[600px]">
        <DialogClose className="modal-close-button">
          <X className="h-4 w-4" />
        </DialogClose>
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-display text-ink-dark">
            <Sparkles className="h-5 w-5 text-accent-primary" />
            Create AI Content
          </DialogTitle>
          <DialogDescription>
            Start a new AI-assisted content creation project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="form-field">
              <Label htmlFor="content-title" className="form-label">Content Title *</Label>
              <Input
                id="content-title"
                placeholder="Enter a title for your content"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <Label htmlFor="description" className="form-label">Description</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe your content (optional)"
                className="form-textarea min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-field">
              <Label className="form-label">Content Type *</Label>
              <RadioGroup
                value={contentType}
                onValueChange={setContentType}
                className="grid grid-cols-2 gap-4"
              >
                {contentTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className={`content-type-option ${contentType === type.id ? 'content-type-option-selected' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem
                        value={type.id}
                        id={type.id}
                        className="mt-1 text-accent-primary"
                      />
                      <div>
                        <Label
                          htmlFor={type.id}
                          className="text-base font-medium cursor-pointer text-ink-dark"
                        >
                          {type.title}
                        </Label>
                        <p className="text-sm text-ink-light">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <p className="text-xs text-ink-faded font-serif">* Required fields</p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title || !contentType}
              >
                Create Content
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-accent-tertiary/10">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-accent-primary/10 rounded-full">
              <Sparkles className="h-4 w-4 text-accent-primary" />
            </div>
            <p className="text-xs text-ink-light font-serif">
              After creating your content, you'll be directed to the Brain Dump tool
              to gather and analyze your raw content. This helps our AI understand
              your ideas and generate better results.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ContentCreationDialog; 