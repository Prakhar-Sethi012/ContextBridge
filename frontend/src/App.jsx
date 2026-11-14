import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import TransitionBlueprint from './components/TransitionBlueprint';
import BusFactorMap from './components/BusFactorMap';
import EvidenceDrawer from './components/EvidenceDrawer';
import LoadingState from './components/LoadingState';
import InteractiveSandbox from './components/InteractiveSandbox';
import { getHandover, getBusFactor, seedChat, generateHandover } from './api';
import { AlertCircle, CheckCircle2, X, RefreshCw } from 'lucide-react';

export default function App() {
  const [projectId, setProjectId] = useState(1);
  const [currentRole, setCurrentRole] = useState('project_head');
  const [activeTab, setActiveTab] = useState('blueprint');

  const [claims, setClaims] = useState([]);
  const [busFactorData, setBusFactorData] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Reconstructing memory...');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);
  const [notification, setNotification] = useState(null);

  // Fetch Handover claims
  const fetchHandoverData = useCallback(async (pId, role) => {
    try {
      const data = await getHandover(pId, role);
      setClaims(Array.isArray(data) ? data : (data.claims || []));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }, []);

  // Fetch Bus-Factor analytics
  const fetchBusFactorData = useCallback(async (pId) => {
    try {
      const data = await getBusFactor(pId);
      setBusFactorData(Array.isArray(data) ? data : []);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }, []);

  // Automatic state wiring via useEffect
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (activeTab === 'sandbox') {
        return;
      }

      setIsLoading(true);
      setLoadingMessage(
        activeTab === 'blueprint'
          ? 'Reconstructing memory...'
          : 'Computing bus-factor continuity...'
      );

      if (activeTab === 'blueprint') {
        await fetchHandoverData(projectId, currentRole);
        // Also fetch bus factor in background for count badges
        fetchBusFactorData(projectId).catch(() => {});
      } else if (activeTab === 'busfactor') {
        await fetchBusFactorData(projectId);
      }

      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [projectId, currentRole, activeTab, fetchHandoverData, fetchBusFactorData]);

  // Seed Database Action
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setErrorMessage(null);
    try {
      const res = await seedChat(projectId);
      setNotification({
        type: 'success',
        text: `Successfully seeded ${res.ingested_count || 5} synthetic engineering sources into Project #${projectId}.`,
      });
      // Refresh current tab
      if (activeTab === 'blueprint') {
        await fetchHandoverData(projectId, currentRole);
      } else {
        await fetchBusFactorData(projectId);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Reconstruct / Generate Handover Blueprint Action
  const handleGenerateBlueprint = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const res = await generateHandover(projectId, currentRole);
      setClaims(res.claims || []);
      setNotification({
        type: 'success',
        text: `Reconstruction complete: extracted ${res.count || res.claims?.length || 0} verified knowledge claims for role "${currentRole}".`,
      });
      if (activeTab !== 'blueprint') {
        setActiveTab('blueprint');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-beige selection:bg-forest selection:text-vibrant">
      {/* Task 3: Flat Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onSeedDatabase={handleSeedDatabase}
        onGenerateBlueprint={handleGenerateBlueprint}
        isSeeding={isSeeding}
        isGenerating={isGenerating}
        projectId={projectId}
        onProjectIdChange={setProjectId}
      />

      {/* Task 4: Flat Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        claimsCount={claims.length}
        domainsCount={busFactorData.length}
        currentRole={currentRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-6 sm:px-8 py-8 space-y-6">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="bg-red-50 border-2 border-red-700 p-4 flex items-start justify-between gap-3 text-red-900 font-mono text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider block">API Error:</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Notification Banner */}
        {notification && (
          <div className="bg-emerald-50 border-2 border-emerald-600 p-4 flex items-start justify-between gap-3 text-emerald-900 font-mono text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block">Operation Succeeded:</span>
                <p className="leading-relaxed">{notification.text}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic View: Blueprint vs Bus Factor vs Sandbox vs Loading */}
        {isLoading && activeTab !== 'sandbox' ? (
          <LoadingState message={loadingMessage} />
        ) : activeTab === 'blueprint' ? (
          <TransitionBlueprint
            claims={claims}
            currentRole={currentRole}
            onSelectClaim={setSelectedClaim}
            onGenerateBlueprint={handleGenerateBlueprint}
            onSeedDatabase={handleSeedDatabase}
            isGenerating={isGenerating}
            isSeeding={isSeeding}
          />
        ) : activeTab === 'busfactor' ? (
          <BusFactorMap
            data={busFactorData}
            projectId={projectId}
            onRefresh={() => fetchBusFactorData(projectId)}
            isRefreshing={isLoading}
          />
        ) : (
          <InteractiveSandbox
            currentRole={currentRole}
            projectId={projectId}
            onApplyToBlueprint={(newClaims) => {
              setClaims((prev) => [...newClaims, ...prev]);
            }}
          />
        )}
      </main>

      {/* Task 5: Evidence Drawer */}
      <EvidenceDrawer
        claim={selectedClaim}
        isOpen={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
      />

      {/* Minimal Footer */}
      <footer className="w-full bg-beige border-t border-beige-border py-4 mt-auto">
        <div className="w-full px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-gray-500 gap-2">
          <span>ContextBridge • Project State Reconstruction Engine</span>
          <span>FastAPI + PostgreSQL pgvector + Gemini RAG + React</span>
        </div>
      </footer>
    </div>
  );
}
