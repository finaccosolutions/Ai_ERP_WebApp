import React from 'react';
import { Plus, FileBadge, Search } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function CreditNotesPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Credit Notes</h1>
          <p className={theme.textSecondary}>Issue and manage credit notes for returns or adjustments.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Credit Note Suggestions')} />
          <Button icon={<Plus size={16} />}>Create New Credit Note</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Credit Notes List</h3>
        {/* Placeholder for credit notes list table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Credit notes list and management will appear here.</p>
        </div>
        {/* AI Feature Idea: Suggest credit note reasons, fraud detection */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="audit" onSuggest={() => console.log('AI Fraud Detection')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CreditNotesPage;
