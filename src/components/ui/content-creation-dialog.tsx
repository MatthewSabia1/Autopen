import React from "react";
import { X, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "./dialog";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { cn } from "@/lib/utils";

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
      <DialogContent className="content-creation-modal sm:max-w-[600px] bg-paper dark:bg-card border-accent-tertiary/20 dark:border-accent-tertiary/40">
        <DialogClose className="modal-close-button text-ink-dark dark:text-ink-light hover:bg-accent-tertiary/10 dark:hover:bg-accent-tertiary/20">
          <X className="h-4 w-4" />
        </DialogClose>
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-display text-ink-dark dark:text-ink-dark">
            <Sparkles className="h-5 w-5 text-accent-primary dark:text-accent-primary" />
            Create AI Content
          </DialogTitle>
          <DialogDescription className="text-ink-light dark:text-ink-light">
            Start a new AI-assisted content creation project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="form-field">
              <Label htmlFor="content-title" className="form-label text-ink-dark dark:text-ink-dark">Content Title <span className="text-red-500 dark:text-red-400">*</span></Label>
              <Input
                id="content-title"
                placeholder="Enter a title for your content"
                className="form-input bg-white dark:bg-card/80 border-accent-tertiary/30 dark:border-accent-tertiary/50 text-ink-dark dark:text-ink-dark focus:border-accent-primary dark:focus:border-accent-primary focus:ring-accent-primary/20 dark:focus:ring-accent-primary/30"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <Label htmlFor="description" className="form-label text-ink-dark dark:text-ink-dark">Description</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe your content (optional)"
                className="form-textarea min-h-[100px] bg-white dark:bg-card/80 border-accent-tertiary/30 dark:border-accent-tertiary/50 text-ink-dark dark:text-ink-dark focus:border-accent-primary dark:focus:border-accent-primary focus:ring-accent-primary/20 dark:focus:ring-accent-primary/30"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-field">
              <Label className="form-label text-ink-dark dark:text-ink-dark">Content Type <span className="text-red-500 dark:text-red-400">*</span></Label>
              <RadioGroup
                value={contentType}
                onValueChange={setContentType}
                className="grid grid-cols-2 gap-4"
              >
                {contentTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className={cn(
                      "relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md dark:hover:shadow-lg",
                      contentType === type.id 
                        ? "border-accent-primary dark:border-accent-primary bg-accent-primary/5 dark:bg-accent-primary/15 shadow-sm dark:shadow-md" 
                        : "border-accent-tertiary/30 dark:border-accent-tertiary/40 hover:border-accent-primary/30 dark:hover:border-accent-primary/40 bg-white dark:bg-card/90"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem
                        value={type.id}
                        id={type.id}
                        className="mt-1 text-accent-primary dark:text-accent-primary"
                      />
                      <div>
                        <Label
                          htmlFor={type.id}
                          className="text-base font-medium cursor-pointer text-ink-dark dark:text-ink-dark"
                        >
                          {type.title}
                        </Label>
                        <p className="text-sm text-ink-light dark:text-ink-light/80">
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
            <p className="text-xs text-ink-faded dark:text-ink-faded/80 font-serif">* Required fields</p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-accent-tertiary/30 dark:border-accent-tertiary/50 text-ink-light dark:text-ink-light"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title || !contentType}
                className="bg-accent-primary dark:bg-accent-primary hover:bg-accent-primary/90 dark:hover:bg-accent-primary/90 text-white"
              >
                Create Content
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-accent-tertiary/10 dark:border-accent-tertiary/30">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full">
              <Sparkles className="h-4 w-4 text-accent-primary dark:text-accent-primary" />
            </div>
            <p className="text-xs text-ink-light dark:text-ink-light/80 font-serif">
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