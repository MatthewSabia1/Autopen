import React, { useState } from 'react';
import { User, Lock, Bell, BookOpen } from 'lucide-react';
import AccountSettings from './AccountSettings';

type SettingsTab = 'account' | 'security' | 'notifications' | 'preferences';

const SettingsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: BookOpen }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8">
      <h1 className="font-display text-3xl text-ink-dark dark:text-dark-text-primary mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-1/4">
          <div className="bg-paper dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-dark-border-secondary p-4">
            <nav>
              <ul className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={`w-full flex items-center px-4 py-3 rounded-md font-serif text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/20'
                            : 'text-ink-light dark:text-dark-text-tertiary hover:bg-cream dark:hover:bg-dark-bg-tertiary'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {tab.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="md:w-3/4">
          {activeTab === 'account' && <AccountSettings />}
          
          {activeTab === 'security' && (
            <div className="bg-paper dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-dark-border-secondary p-8">
              <h2 className="font-display text-3xl text-ink-dark dark:text-dark-text-primary mb-6 flex items-center">
                <Lock className="w-8 h-8 mr-3 text-accent-primary" />
                Security
              </h2>
              <p className="font-serif text-ink-light dark:text-dark-text-tertiary">
                Security settings will be available in a future update.
              </p>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="bg-paper dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-dark-border-secondary p-8">
              <h2 className="font-display text-3xl text-ink-dark dark:text-dark-text-primary mb-6 flex items-center">
                <Bell className="w-8 h-8 mr-3 text-accent-primary" />
                Notifications
              </h2>
              <p className="font-serif text-ink-light dark:text-dark-text-tertiary">
                Notification settings will be available in a future update.
              </p>
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="bg-paper dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-dark-border-secondary p-8">
              <h2 className="font-display text-3xl text-ink-dark dark:text-dark-text-primary mb-6 flex items-center">
                <BookOpen className="w-8 h-8 mr-3 text-accent-primary" />
                Preferences
              </h2>
              <p className="font-serif text-ink-light dark:text-dark-text-tertiary">
                Preference settings will be available in a future update.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;