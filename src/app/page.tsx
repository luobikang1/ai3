'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileTabBar } from '@/components/MobileTabBar';
import { Txt2ImgTab } from '@/components/Txt2ImgTab';
import { Img2ImgTab } from '@/components/Img2ImgTab';
import { ImageEditorTab } from '@/components/ImageEditorTab';
import { ModelSelector } from '@/components/ModelSelector';
import { HistoryTab } from '@/components/HistoryTab';
import { SettingsTab } from '@/components/SettingsTab';
import { Toast } from '@/components/Toast';
import { LoginGateScreen } from '@/components/LoginGateScreen';
import { AuthModal } from '@/components/AuthModal';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'txt2img' | 'img2img' | 'edit' | 'models' | 'history' | 'settings'>('txt2img');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { auth, toast } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Main Container */}
      {!auth.isLoggedIn ? (
        <LoginGateScreen />
      ) : (
        <>
          {/* Header Bar with Fixed Brand "白狐AI三" */}
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Content Workspace */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 transition-all duration-300">
            {activeTab === 'txt2img' && <Txt2ImgTab />}
            {activeTab === 'img2img' && <Img2ImgTab />}
            {activeTab === 'edit' && <ImageEditorTab />}
            {activeTab === 'models' && <ModelSelector isFullPage />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </main>

          {/* Mobile Tab Bar Navigation */}
          <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}
    </div>
  );
}
