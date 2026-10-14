import React, { useState, useRef } from 'react';
import {
  Palette,
  Upload,
  CheckCircle2,
  AlertCircle,
  Image,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Eye,
  Trash2,
  Building2,
  Award,
  Layers,
} from 'lucide-react';
import { SchoolConfig } from '../../types';

interface BrandingSettingsProps {
  schoolConfig: SchoolConfig | null;
  currentUserRole?: string;
  onSaveConfig: (config: Partial<SchoolConfig>) => Promise<void>;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({
  schoolConfig,
  currentUserRole = 'admin',
  onSaveConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default royal blue and white colors
  const DEFAULT_PRIMARY = '#4169E1'; // Royal Blue
  const DEFAULT_SECONDARY = '#1E3A8A'; // Deep Navy Royal
  const DEFAULT_WHITE = '#FFFFFF';
  const DEFAULT_LIGHT_BG = '#F0F5FF'; // Royal Blue light tint

  const [schoolName, setSchoolName] = useState(
    schoolConfig?.schoolName || 'Kingsway Model Secondary School'
  );
  const [motto, setMotto] = useState(
    schoolConfig?.motto || 'Excellence, Knowledge and Character'
  );
  const [logoUrl, setLogoUrl] = useState<string>(schoolConfig?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState<string>(
    schoolConfig?.primaryColor || DEFAULT_PRIMARY
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    schoolConfig?.secondaryColor || DEFAULT_SECONDARY
  );
  const [lightBgColor, setLightBgColor] = useState<string>(
    schoolConfig?.lightBgColor || DEFAULT_LIGHT_BG
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAuthorized =
    currentUserRole === 'admin' ||
    currentUserRole === 'principal' ||
    currentUserRole === 'proprietor';

  // Handle Logo File Upload (PNG/JPG/SVG)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (.png, .jpg, .svg, .webp)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Logo file exceeds 2MB limit. Please upload an optimized image.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Reset to the official Royal Blue and White theme
  const handleApplyRoyalBluePreset = () => {
    setPrimaryColor(DEFAULT_PRIMARY);
    setSecondaryColor(DEFAULT_SECONDARY);
    setLightBgColor(DEFAULT_LIGHT_BG);
  };

  const handleSaveBranding = async () => {
    if (!isAuthorized) {
      setErrorMsg('Unauthorized: Only administrators or principals can modify school branding.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSaveConfig({
        schoolName,
        motto,
        logoUrl,
        primaryColor,
        secondaryColor,
        lightBgColor,
        borderColor: '#D6E3FF',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Authorization Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                School Branding & Visual Identity
              </h2>
              <p className="text-xs text-slate-500">
                Define the institutional crest and Royal Blue (#4169E1) & White theme colors
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleApplyRoyalBluePreset}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Apply Royal Blue Preset</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBranding}
            disabled={isSaving || !isAuthorized}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-all flex items-center space-x-2 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Branding</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-800 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Institutional branding updated successfully! Royal Blue and White colors are now active across
            report cards, exam papers, and staff portals.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Upload Crest + Colors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Official Logo Crest Upload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Official School Crest / Logo
            </h3>
          </div>

          {/* Logo Preview & Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Official Crest"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center p-2">
                  <Image className="w-8 h-8 text-slate-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-medium">No Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <p className="text-xs font-bold text-slate-800">School Crest Badge</p>
              <p className="text-[11px] text-slate-500">
                Recommended: Square or crest logo in PNG or SVG format with transparent background (Max 2MB).
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Logo File</span>
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Logo URL alternative */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Or External Logo URL
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/crest.png"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Institutional Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Official School Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Institutional Motto</label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Royal Blue (#4169E1) & White (#FFFFFF) Color Definitions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Institutional Color Palette
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Royal Blue & White
            </span>
          </div>

          <div className="space-y-4">
            {/* Primary Color: Royal Blue */}
            <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <span>Primary Theme Color</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                    Royal Blue
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Applied to headers, primary action buttons, exam titles, and badges
                </p>
                <code className="text-xs font-mono font-bold text-blue-700 mt-1 inline-block">
                  {primaryColor}
                </code>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                />
              </div>
            </div>

            {/* Secondary Accent: Deep Royal Navy */}
            <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <span>Secondary Dark Accent</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                    Deep Royal
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Used for sidebar highlights, footer accents, and official seals
                </p>
                <code className="text-xs font-mono font-bold text-slate-700 mt-1 inline-block">
                  {secondaryColor}
                </code>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                />
              </div>
            </div>

            {/* Light Canvas Background: White / Royal Tint */}
            <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <span>Light Canvas & Cards</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                    White / Crisp
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Clean white backdrop for high-contrast legible examination questions & broadsheets
                </p>
                <code className="text-xs font-mono font-bold text-slate-700 mt-1 inline-block">
                  #FFFFFF (White) & {lightBgColor}
                </code>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={lightBgColor}
                  onChange={(e) => setLightBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Previews of the School Branding */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Eye className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Live Institutional Identity Previews
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview 1: Header / Navbar Mockup */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">App Navigation Bar Mockup</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">Active Theme</span>
            </div>
            <div
              className="p-3 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                  {logoUrl ? (
                    <img src={logoUrl} alt="crest" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{schoolName}</h4>
                  <p className="text-[10px] text-blue-100 italic">{motto}</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white">
                SAMS Portal
              </div>
            </div>
          </div>

          {/* Preview 2: Official Examination Paper Crest Mockup */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Printable Exam Paper Crest Header</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">Print Ready</span>
            </div>
            <div className="p-4 text-center border-b border-slate-300">
              <div className="flex items-center justify-center space-x-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 p-1 flex items-center justify-center shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="crest" className="w-full h-full object-contain" />
                  ) : (
                    <Award className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <h4
                  className="text-xs font-extrabold uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  {schoolName}
                </h4>
              </div>
              <p className="text-[10px] text-slate-500 italic mb-1.5">{motto}</p>
              <div
                className="py-0.5 px-3 rounded inline-block text-[10px] font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: primaryColor }}
              >
                End-of-Term Examination & Continuous Assessment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
