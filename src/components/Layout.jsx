import React from 'react';
import NavigationRail from './NavigationRail';
import ProfileContextBar from './ProfileContextBar';

const Layout = ({ 
  children, 
  activeTab, 
  onTabChange, 
  navTabs, 
  userProfile, 
  profileUnsaved, 
  onEditProfile, 
  onSaveProfile, 
  onResetProfile,
  profileExpanded,
  onToggleProfileExpand,
  filterItems,
  onResetFilters,
  onManageFilters
}) => {
  return (
    <div className="flex h-screen bg-physio-bg-core text-physio-text-primary overflow-hidden font-sans selection:bg-physio-accent-primary/30">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col flex-shrink-0 z-30 relative">
        <div className="absolute inset-0 bg-physio-bg-core/80 backdrop-blur-xl border-r border-physio-border-subtle" />
        
        <div className="relative h-20 flex items-center px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-physio-accent-primary to-physio-accent-secondary rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">physioLab</h1>
              <span className="text-[10px] text-physio-text-tertiary uppercase tracking-widest font-medium">Analytics</span>
            </div>
          </div>
        </div>
        
        <div className="relative flex-1 py-6 px-4 overflow-y-auto">
          <div className="mb-8">
            <p className="px-4 mb-4 text-[10px] uppercase tracking-[0.2em] text-physio-text-secondary/60 font-bold">
              Modules
            </p>
            <NavigationRail tabs={navTabs} activeTab={activeTab} onTabChange={onTabChange} />
          </div>
        </div>

        <div className="relative p-6">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-physio-accent-success shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-physio-text-secondary">System Online</span>
            </div>
            <p className="text-[10px] text-physio-text-tertiary leading-relaxed">
              Clinical Obsidian Engine v2.4
              <br />
              Harm reduction modeling active.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-physio-bg-core">
        {/* Top Bar */}
        <header className="h-16 border-b border-physio-border-subtle flex items-center justify-between px-8 bg-physio-bg-core/80 backdrop-blur-md z-10 shrink-0 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-physio-text-primary tracking-tight">
              {navTabs.find(t => t.key === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <ProfileContextBar
              profile={userProfile}
              unsaved={profileUnsaved}
              onEditProfile={onEditProfile}
              onSaveProfile={onSaveProfile}
              onResetProfile={onResetProfile}
              expanded={profileExpanded}
              onToggleExpand={onToggleProfileExpand}
              filterItems={filterItems}
              onResetFilters={onResetFilters}
              onManageFilters={onManageFilters}
            />
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto pb-20 animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
