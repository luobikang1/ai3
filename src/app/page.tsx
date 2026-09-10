'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { MobileTabBar, TabType } from '@/components/MobileTabBar';
import { Txt2ImgTab } from '@/components/Txt2ImgTab';
import { Img2ImgTab } from '@/components/Img2ImgTab';
import { ImageEditorTab } from '@/components/ImageEditorTab';
import { ModelSelector } from '@/components/ModelSelector';
import { HistoryTab } from '@/components/HistoryTab';
import { SettingsTab } from '@/components/SettingsTab';
import { AuthModal } from '@/components/AuthModal';
import { LoginGateScreen } from '@/components/LoginGateScreen';
import { Toast } from '@/components/Toast';

function MainApp() {
  const { auth } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('txt2img');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  // Cross-tab interaction: Use generated image in Img2Img tab
  const handleSwitchToImg2ImgWithRef = (imageUrl: string) => {
    setActiveTab('img2img');
  };

  // Require auth to access main UI
  if (!auth.isLoggedIn) {
    return <LoginGateScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col antialiased">
      <Toast />
      <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 md:p-6">
        {activeTab === 'txt2img' && (
          <Txt2ImgTab
            onOpenModelModal={() => setIsModelModalOpen(true)}
            onSwitchToImg2ImgWithRef={handleSwitchToImg2ImgWithRef}
          />
        )}
        {activeTab === 'img2img' && (
          <Img2ImgTab onOpenModelModal={() => setIsModelModalOpen(true)} />
        )}
        {activeTab === 'edit' && <ImageEditorTab />}
        {activeTab === 'models' && <ModelSelector />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {isModelModalOpen && (
        <ModelSelector
          isOpenModal={true}
          onCloseModal={() => setIsModelModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
