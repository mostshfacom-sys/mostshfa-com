'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Drug {
  id: number;
  nameAr: string;
}

interface Interaction {
  drug1: Drug;
  drug2: Drug;
  severity: 'severe' | 'moderate' | 'mild';
  description: string;
  recommendation: string;
}

interface DrugInteractionsProps {
  currentDrug?: Drug;
}

export default function DrugInteractions({ currentDrug }: DrugInteractionsProps) {
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>(currentDrug ? [currentDrug] : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [disclaimer, setDisclaimer] = useState('');

  const searchDrugs = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/drugs?search=${encodeURIComponent(query)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.drugs?.filter((d: Drug) => !selectedDrugs.find((s) => s.id === d.id)) || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const addDrug = (drug: Drug) => {
    if (selectedDrugs.length < 5 && !selectedDrugs.find((d) => d.id === drug.id)) {
      setSelectedDrugs([...selectedDrugs, drug]);
      setSearchQuery('');
      setSearchResults([]);
      setChecked(false);
    }
  };

  const removeDrug = (drugId: number) => {
    setSelectedDrugs(selectedDrugs.filter((d) => d.id !== drugId));
    setChecked(false);
  };

  const checkInteractions = async () => {
    if (selectedDrugs.length < 2) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/drugs/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugIds: selectedDrugs.map((d) => d.id) }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setInteractions(data.interactions || []);
        setDisclaimer(data.disclaimer || '');
        setChecked(true);
      }
    } catch (err) {
      console.error('Check interactions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'severe': return 'خطير';
      case 'moderate': return 'متوسط';
      case 'mild': return 'منخفض';
      default: return severity;
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        فحص التفاعلات الدوائية
      </h2>

      {/* Selected Drugs */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الأدوية المحددة ({selectedDrugs.length}/5)
        </label>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 rounded-lg">
          {selectedDrugs.map((drug) => (
            <span
              key={drug.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm border"
            >
              {drug.nameAr}
              <button
                onClick={() => removeDrug(drug.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {selectedDrugs.length === 0 && (
            <span className="text-gray-400 text-sm">أضف أدوية للتحقق من التفاعلات</span>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchDrugs(e.target.value);
          }}
          placeholder="ابحث عن دواء لإضافته..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={selectedDrugs.length >= 5}
        />
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((drug) => (
              <button
                key={drug.id}
                onClick={() => addDrug(drug)}
                className="w-full px-4 py-2 text-right hover:bg-gray-50 border-b last:border-b-0"
              >
                {drug.nameAr}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Check Button */}
      <button
        onClick={checkInteractions}
        disabled={selectedDrugs.length < 2 || loading}
        className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'جاري الفحص...' : 'فحص التفاعلات'}
      </button>

      {/* Results */}
      {checked && (
        <div className="mt-4">
          {interactions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-medium text-red-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                تم العثور على {interactions.length} تفاعل محتمل
              </h3>
              {interactions.map((int, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(int.severity)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{int.drug1.nameAr} + {int.drug2.nameAr}</span>
                    <Badge variant={int.severity === 'severe' ? 'danger' : int.severity === 'moderate' ? 'warning' : 'info'}>
                      {getSeverityLabel(int.severity)}
                    </Badge>
                  </div>
                  <p className="text-sm">{int.description}</p>
                  {int.recommendation && (
                    <p className="text-sm mt-2 text-gray-600">
                      <strong>التوصية:</strong> {int.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                لم يتم العثور على تفاعلات معروفة بين هذه الأدوية
              </p>
            </div>
          )}
          
          {disclaimer && (
            <p className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">{disclaimer}</p>
          )}
        </div>
      )}
    </Card>
  );
}
