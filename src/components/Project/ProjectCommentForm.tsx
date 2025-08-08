// src/components/Project/ProjectCommentForm.tsx
import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectCommentFormProps {
  projectId: string;
  onSuccess: () => void;
}

function ProjectCommentForm({ projectId, onSuccess }: ProjectCommentFormProps) {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const { user } = useAuth(); // Get current user for comment attribution

  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      showNotification('Comment cannot be empty.', 'error');
      return;
    }
    if (!user?.id) {
      showNotification('You must be logged in to add comments.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          comment_text: commentText.trim(),
        });

      if (error) throw error;

      setCommentText('');
      onSuccess(); // Trigger parent to refresh comments
      showNotification('Comment added successfully!', 'success');
    } catch (err: any) {
      showNotification(`Failed to add comment: ${err.message}`, 'error');
      console.error('Add comment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-3 flex items-center`}>
        <MessageSquare size={20} className="mr-2 text-[${theme.hoverAccent}]" />
        Add New Comment
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField
          label="Your Comment"
          value={commentText}
          onChange={setCommentText}
          placeholder="Type your comment here..."
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading || !commentText.trim()} icon={<Send size={16} />}>
            {loading ? 'Adding...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ProjectCommentForm;
