import React from 'react';
import { useAuthStore } from '../store/auth';
import { 
  User, 
  Moon,
  Sun,
  Github,
  Terminal,
  Save,
  Shield
} from 'lucide-react';
import { useThemeStore } from '../store/theme';

export function Profile() {
  const { user, updateUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'viewer',
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Update user data
      updateUser(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'viewer',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Profile Settings</h1>
        <p className="text-lg text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full p-2 rounded-md border bg-background disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full p-2 rounded-md border bg-background disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role']})}
                    disabled={!isEditing}
                    className="w-full p-2 rounded-md border bg-background disabled:opacity-60"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="pt-4">
                  {isEditing ? (
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <span className="animate-spin mr-2">⋯</span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                Appearance
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred theme
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-white hover:bg-primary/90"
                >
                  {theme === 'light' ? (
                    <Sun className="h-4 w-4 mr-2" />
                  ) : (
                    <Moon className="h-4 w-4 mr-2" />
                  )}
                  {theme === 'light' ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <button className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">API Tokens</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your API tokens
                    </p>
                  </div>
                  <button className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Integrations
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="h-6 w-6" />
                    <div>
                      <p className="font-medium">GitHub</p>
                      <p className="text-sm text-muted-foreground">
                        Connect your GitHub account
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}