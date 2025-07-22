// src/pages/Accounting/vouchers/JournalPage.tsx
import React from 'react';
import { ClipboardList, Plus, ArrowLeft } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

function JournalPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Journal Entries</h1>
          <p className={theme.textSecondary}>Record all non-cash transactions.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/accounting')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Journal Suggestions')} />
          <Button icon={<Plus size={16} />}>Record New Journal</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Recent Journal Entries</h3>
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>No recent journal entries found. Record a new one to get started.</p>
        </div>
      </Card>
    </div>
  );
}

export default JournalPage;