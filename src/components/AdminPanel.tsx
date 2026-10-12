import React, { useState } from 'react';
import { MenuItem, RestaurantSettings } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Upload, 
  Database, 
  Sheet, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  UtensilsCrossed, 
  KeyRound
} from 'lucide-react';
import { SheetsSyncService, GOOGLE_APPS_SCRIPT_TEMPLATE } from '../services/sheetsSync';
import { StorageService } from '../services/storage';

interface AdminPanelProps {
  menuItems: MenuItem[];
  categories: string[];
  settings: RestaurantSettings;
  onSaveMenuItems: (items: MenuItem[]) => void;
  onSaveCategories: (cats: string[]) => void;
  onSaveSettings: (settings: RestaurantSettings) => void;
  onDataRestored: () => void;
  currencySymbol: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  menuItems,
  categories,
  settings,
  onSaveMenuItems,
  onSaveCategories,
  onSaveSettings,
  onDataRestored,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'settings' | 'sheets' | 'backup'>('menu');

  // Menu item modal state
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>({ ...settings });
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Category input state
  const [newCategoryName, setNewCategoryName] = useState('');

  // Google Sheets state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Backup restore state
  const [restoreMessage, setRestoreMessage] = useState<{ success: boolean; message: string } | null>(null);

  // Menu item handlers
  const handleOpenNewItem = () => {
    setEditingItem({
      id: 'item_' + Date.now(),
      name: '',
      urduName: '',
      category: categories[0] || 'Burgers',
      price: 500,
      image: '',
      available: true,
      description: '',
    });
    setIsEditingItem(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem({ ...item });
    setIsEditingItem(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      const updated = menuItems.filter((i) => i.id !== id);
      onSaveMenuItems(updated);
    }
  };

  const handleToggleItemAvailability = (item: MenuItem) => {
    const updated = menuItems.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i));
    onSaveMenuItems(updated);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name || !editingItem.price) {
      alert('Please enter a valid item name and price.');
      return;
    }

    const itemToSave = editingItem as MenuItem;
    const exists = menuItems.some((i) => i.id === itemToSave.id);

    let updated: MenuItem[];
    if (exists) {
      updated = menuItems.map((i) => (i.id === itemToSave.id ? itemToSave : i));
    } else {
      updated = [itemToSave, ...menuItems];
    }

    onSaveMenuItems(updated);
    setIsEditingItem(false);
    setEditingItem(null);
  };

  // Image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditingItem((prev) => (prev ? { ...prev, image: result } : null));
      };
      reader.readAsDataURL(file);
    }
  };

  // Category handlers
  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.map((c) => c.toLowerCase()).includes(name.toLowerCase())) {
      alert('Category already exists.');
      return;
    }
    const updated = [...categories, name];
    onSaveCategories(updated);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catName: string) => {
    if (confirm(`Delete category "${catName}"? Items in this category will keep their current tag.`)) {
      const updated = categories.filter((c) => c !== catName);
      onSaveCategories(updated);
    }
  };

  // Settings save handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settingsForm);
    setSettingsSavedSuccess(true);
    setTimeout(() => setSettingsSavedSuccess(false), 3000);
  };

  // Google Sheets Test
  const handleTestSheets = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    const res = await SheetsSyncService.testConnection(settingsForm.googleAppsScriptUrl);
    setConnectionResult(res);
    setTestingConnection(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 3000);
  };

  // Restore handler
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const res = StorageService.restoreFromBackup(content);
        setRestoreMessage(res);
        if (res.success) {
          onDataRestored();
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtabs Bar */}
      <div className="bg-white dark:bg-stone-900 p-2 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'menu'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Menu Dishes ({menuItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Restaurant & Billing Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'sheets'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Sheet className="w-3.5 h-3.5" />
          <span>Google Sheets Webhook</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backup & Reset</span>
        </button>
      </div>

      {/* TAB 1: MENU ITEMS */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Menu Items Manager</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Add, edit prices, upload photos, or toggle availability in real-time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewItem}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Dish</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <UtensilsCrossed className="w-4 h-4 opacity-40" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900 dark:text-white">{item.name}</h4>
                            {item.urduName && (
                              <p className="text-[11px] text-stone-500 font-sans">{item.urduName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-stone-900 dark:text-white">
                        {currencySymbol} {item.price.toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleItemAvailability(item)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                            item.available
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {item.available ? 'AVAILABLE' : 'OUT OF STOCK'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditItem(item)}
                          className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">Category Manager</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Create and reorganize food categories displayed on the counter screen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="e.g. Seafood, Mocktails, Soups..."
              className="flex-1 px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
            {categories.map((cat) => {
              const count = menuItems.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length;
              return (
                <div key={cat} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white text-sm">{cat}</span>
                    <span className="text-[11px] text-stone-400 ml-2">({count} items)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RESTAURANT & BILLING SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Restaurant & Receipt Settings
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Configure your restaurant details, tax percentage, printer format, and security PINs.
              </p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>

          {settingsSavedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Restaurant settings updated successfully!</span>
            </div>
          )}

          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 pb-2">
              Identity & Contact Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.restaurantName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, restaurantName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Address (Printed on receipt)
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Phone Number 1
                </label>
                <input
                  type="text"
                  value={settingsForm.phone1}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone1: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Phone Number 2 / WhatsApp
                </label>
                <input
                  type="text"
                  value={settingsForm.phone2}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone2: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  FBR / NTN Registration No
                </label>
                <input
                  type="text"
                  value={settingsForm.ntnNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, ntnNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settingsForm.currencySymbol}
                  onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 pb-2">
              Billing & Receipt Specifications
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Sales Tax Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settingsForm.taxRate}
                  onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  e.g. 5% PRA/SRB or 16% standard services sales tax
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Default Printer Type
                </label>
                <select
                  value={settingsForm.defaultPrinterType}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      defaultPrinterType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="thermal-80mm">80mm Thermal Receipt (POS Roll)</option>
                  <option value="a4">Standard A4 Sheet Format</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Receipt Footer Note
                </label>
                <input
                  type="text"
                  value={settingsForm.footerText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                  placeholder="Thank you for visiting! Follow us on Instagram..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Security PINs */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 pb-2 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>Access Security PINs</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Receptionist PIN (Counter Unlock)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={settingsForm.receptionistPin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, receptionistPin: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Default: 1234</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Admin PIN (Menu & Financial Settings)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={settingsForm.adminPin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Default: 9999</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: GOOGLE SHEETS SETUP */}
      {activeTab === 'sheets' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Google Sheets Live Sync Integration
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Every completed receipt can automatically stream as a new row into your Google Sheet. If offline, orders queue and sync automatically when connection returns.
            </p>
          </div>

          {/* Webhook Configuration Field */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              Google Apps Script Webhook URL
            </h4>

            <div className="space-y-2">
              <input
                type="url"
                value={settingsForm.googleAppsScriptUrl}
                onChange={(e) => {
                  const updated = { ...settingsForm, googleAppsScriptUrl: e.target.value };
                  setSettingsForm(updated);
                  onSaveSettings(updated);
                }}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={testingConnection || !settingsForm.googleAppsScriptUrl}
                  onClick={handleTestSheets}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>

                {connectionResult && (
                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${
                      connectionResult.success
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {connectionResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{connectionResult.message}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3-Step Setup Instructions */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 text-xs">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              Step-by-Step Setup Guide (5 Minutes)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                <h5 className="font-bold text-stone-900 dark:text-white">Create Google Sheet</h5>
                <p className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">
                  Open Google Drive and create a new sheet named <strong>&quot;Hotspot Orders&quot;</strong>. Open <strong>Extensions &gt; Apps Script</strong> from the top menu.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                <h5 className="font-bold text-stone-900 dark:text-white">Paste the Code</h5>
                <p className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">
                  Delete all existing code in <code>Code.gs</code>. Copy the script below, paste it, and save (Ctrl+S).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">
                  3
                </span>
                <h5 className="font-bold text-stone-900 dark:text-white">Deploy as Web App</h5>
                <p className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">
                  Click <strong>Deploy &gt; New deployment &gt; Web app</strong>. Set <em>Execute as: Me</em> and <em>Who has access: Anyone</em>. Copy the Web App URL into the field above!
                </p>
              </div>
            </div>

            {/* Code Box */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                  Google Apps Script Webhook Code (Code.gs):
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{codeCopied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-3 bg-stone-950 text-stone-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                {GOOGLE_APPS_SCRIPT_TEMPLATE}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Data Storage, Backup & System Recovery
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              All menu items, categories, settings, and orders are stored in your browser&apos;s local storage. You can create full file backups or restore on another computer.
            </p>
          </div>

          {restoreMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                restoreMessage.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {restoreMessage.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{restoreMessage.message}</span>
            </div>
          )}

          {/* LAPTOP & MULTI-DEVICE USAGE GUIDE */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>💻 دوسرے لیپ ٹاپ یا کاؤنٹر پر چلانے کا طریقہ (How to Run on Another Laptop)</span>
            </h4>
            <div className="text-xs text-stone-600 dark:text-stone-300 space-y-2 leading-relaxed">
              <p>
                <strong>1. براہ راست لنک کھولیں:</strong> کسی بھی دوسرے لیپ ٹاپ یا پی سی کے براؤزر (Google Chrome یا Edge) میں اس ایپلیکیشن کا لنک کھولیں۔ کسی بھی قسم کی انسٹالیشن کی ضرورت نہیں ہے۔
              </p>
              <p>
                <strong>2. تھرمل رسید پرنٹر (80mm Thermal Printer):</strong> جب آپ پرنٹ پر کلک کریں تو پرنٹر لسٹ میں اپنا 80mm پرنٹر منتخب کریں اور Margins کو <code>None</code> رکھیں۔
              </p>
              <p>
                <strong>3. آف لائن استعمال:</strong> ایک بار پیج لوڈ ہونے کے بعد یہ انٹرنیٹ بند ہونے پر بھی 100% چلے گا اور تمام بل لوکل محفوظ رہیں گے۔
              </p>
              <p>
                <strong>4. ڈیٹا منتقلی (Data Backup/Restore):</strong> ایک لیپ ٹاپ سے <em>&quot;Download Backup File&quot;</em> ڈاؤن لوڈ کر کے دوسرے لیپ ٹاپ پر <em>&quot;Choose Backup File to Restore&quot;</em> سے 2 سیکنڈ میں تمام مینو اور سیٹنگز لوڈ کر سکتے ہیں۔
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              1. Download Complete Backup (JSON)
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Saves all bills, menu items, prices, categories, and settings to a portable JSON file.
            </p>
            <button
              type="button"
              onClick={() => StorageService.createFullBackup()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Download Backup File</span>
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              2. Restore from Backup File
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Select a previously downloaded <code>Hotspot_POS_Backup_*.json</code> file to restore data.
            </p>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 dark:border-stone-700">
              <Upload className="w-4 h-4" />
              <span>Choose Backup File to Restore</span>
              <input type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
            </label>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              3. Reset to Factory Sample Data
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Reloads the 24+ default Pakistani dishes (Burgers, BBQ, Pizza, Fast Food, Drinks, Desserts) and initial restaurant settings.
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset menu and settings to default sample data? This will not erase existing order history.')) {
                  StorageService.resetToSampleData();
                  onDataRestored();
                  alert('Reset successfully!');
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
            >
              Reset Menu to Sample Data
            </button>
          </div>
        </div>
      )}

      {/* DISH CREATE / EDIT MODAL */}
      {isEditingItem && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {menuItems.some((i) => i.id === editingItem.id) ? 'Edit Dish' : 'Add New Dish'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingItem(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Dish Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Crispy Zinger Burger"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Urdu Name (Optional)
                </label>
                <input
                  type="text"
                  value={editingItem.urduName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, urduName: e.target.value })}
                  placeholder="e.g. کرسپی زنگر برگر"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Category
                  </label>
                  <select
                    value={editingItem.category || categories[0]}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingItem.price || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })}
                    placeholder="e.g. 550"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-mono-numbers focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Description / Ingredients
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Ingredients, spice level, or details..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Image Upload or URL */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Dish Photo
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg font-medium cursor-pointer border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  <input
                    type="text"
                    value={editingItem.image || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                    placeholder="Or paste image URL"
                    className="flex-1 px-2.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white text-[11px]"
                  />
                </div>

                {editingItem.image && (
                  <div className="mt-2 w-20 h-16 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700">
                    <img src={editingItem.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Available toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="itemAvailable"
                  checked={editingItem.available ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-stone-300 focus:ring-amber-500"
                />
                <label htmlFor="itemAvailable" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Item is Available for Ordering
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsEditingItem(false)}
                  className="px-3.5 py-2 text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
