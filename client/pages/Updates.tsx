
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { translations, Language } from '../locales';
import { Upload, Download, CheckCircle2, GitBranch, Monitor, Calendar, AlertTriangle, Box, ArrowRight, Trash2, Edit2, Save, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { AppVersion } from '../types';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

interface UpdatesProps {
    currentLang: Language;
}

const Updates: React.FC<UpdatesProps> = ({ currentLang }) => {
    const t = translations[currentLang];
    const { tick: autoRefreshTick, requestRefresh } = useAutoRefresh();
    const [versions, setVersions] = useState<AppVersion[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        version: '',
        notes: '',
        url: '',
        force: false,
        isActive: true
    });
    const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);

    useEffect(() => {
        api.getVersions().then(setVersions).catch(console.error);
    }, [autoRefreshTick]);

    const latestVersion = versions.filter(v => v.isActive).length > 0 ? versions.filter(v => v.isActive)[0] : null;

    const handleCreateClick = () => {
        setEditingId(null);
        setFormData({ version: '', notes: '', url: '', force: false, isActive: true });
        setIsFormOpen(true);
    };

    const handleEditClick = (v: AppVersion) => {
        setEditingId(v.id);
        setFormData({
            version: v.version,
            notes: v.releaseNotes,
            url: v.downloadUrl,
            force: v.forceUpdate,
            isActive: v.isActive
        });
        setIsFormOpen(true);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async () => {
        if (editingId) {
            await api.updateVersion(editingId, {
                version: formData.version,
                releaseNotes: formData.notes,
                downloadUrl: formData.url,
                forceUpdate: formData.force,
                isActive: formData.isActive
            });
        } else {
            await api.createVersion({
                version: formData.version,
                releaseNotes: formData.notes,
                downloadUrl: formData.url,
                forceUpdate: formData.force,
                isActive: formData.isActive
            });
        }
        setVersions(await api.getVersions());
        requestRefresh();
        setIsFormOpen(false);
        setFormData({ version: '', notes: '', url: '', force: false, isActive: true });
        setEditingId(null);
    };

    const handleToggleActive = (id: string, currentStatus: boolean) => {
        api.updateVersion(id, { isActive: !currentStatus }).then(async () => {
            setVersions(await api.getVersions());
            requestRefresh();
        });
    }

    const handleDelete = (id: string) => {
        setDeleteVersionId(id);
    }

    const confirmDelete = () => {
        if (deleteVersionId) {
            api.deleteVersion(deleteVersionId).then(async () => {
                setVersions(await api.getVersions());
                requestRefresh();
                if (editingId === deleteVersionId) {
                    setIsFormOpen(false);
                    setEditingId(null);
                }
                setDeleteVersionId(null);
            });
        }
    }

    const handleDownload = (version: string) => {
        const fileName = `SourcePlus_Setup_v${version}.exe`;
        // Create a dummy file for simulation
        const element = document.createElement("a");
        const file = new Blob([`Simulated binary content for SourcePlus v${version}\n\nWarning: This is a dummy file for demonstration purposes.`], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = fileName;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Monitor className="text-primary-600" size={32} />
                        {t.updates}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage software releases, patches, and deployment channels.</p>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl font-bold"
                    >
                        <Upload size={18} />
                        Deploy New Build
                    </button>
                )}
            </div>

            {/* Deploy/Edit Form */}
            {isFormOpen && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-primary-100 dark:border-slate-700 mb-8 animate-in slide-in-from-top-4 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${editingId ? 'bg-amber-500' : 'bg-primary-500'}`}></div>
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {editingId ? <Edit2 className="text-amber-500" /> : <Upload className="text-primary-500" />}
                            {editingId ? 'Edit Version Details' : 'Publish New Version'}
                        </h3>
                        <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Version Number</label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                                    placeholder="e.g. 1.0.0"
                                    value={formData.version}
                                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Installer URL (CDN)</label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                                    placeholder="https://cdn.sourceplus.com/builds/setup.exe"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 cursor-pointer" onClick={() => setFormData({ ...formData, force: !formData.force })}>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.force ? 'bg-rose-600 border-rose-600 text-white' : 'border-rose-300 bg-white'}`}>
                                            {formData.force && <CheckCircle2 size={14} />}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-rose-900 dark:text-rose-400 cursor-pointer select-none">Force Update</label>
                                            <p className="text-xs text-rose-700 dark:text-rose-300/70 mt-1 select-none">Critical security patch</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 cursor-pointer" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isActive ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-emerald-300 bg-white'}`}>
                                            {formData.isActive && <CheckCircle2 size={14} />}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-emerald-900 dark:text-emerald-400 cursor-pointer select-none">Active Release</label>
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300/70 mt-1 select-none">Visible to users</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Release Notes (Markdown)</label>
                            <textarea
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none min-h-[200px] font-mono text-sm leading-relaxed"
                                placeholder="- Initial release&#10;- Fixed login bugs"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                        <button onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.version}
                            className={`px-8 py-2.5 text-white rounded-lg font-bold shadow-md disabled:opacity-50 transition-colors flex items-center gap-2 ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary-600 hover:bg-primary-700'}`}
                        >
                            <Save size={18} />
                            {editingId ? 'Save Changes' : 'Publish Release'}
                        </button>
                    </div>
                </div>
            )}

            {versions.length === 0 && !isFormOpen ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-6">
                        <Box size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Releases Yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center mb-8">
                        Get started by deploying your first application version. Users will be able to download it immediately.
                    </p>
                    <button
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold"
                    >
                        Deploy First Build <ArrowRight size={18} />
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Latest Release Banner - Only show if valid latest exists */}
                    {latestVersion && !isFormOpen && (
                        <div className="w-full bg-gradient-to-r from-slate-900 to-primary-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-700">
                            {/* Abstract Bg */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                                <div className="lg:col-span-2">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                                            <CheckCircle2 size={12} /> Latest Stable
                                        </span>
                                        <span className="text-slate-300 text-sm flex items-center gap-1">
                                            <Calendar size={14} /> {new Date(latestVersion.releaseDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h2 className="text-5xl lg:text-6xl font-bold mb-4 tracking-tight">v{latestVersion.version}</h2>
                                    <p className="text-slate-200 text-lg lg:text-xl leading-relaxed max-w-2xl">{latestVersion.releaseNotes}</p>

                                    <div className="mt-8 flex flex-wrap gap-4">
                                        <button
                                            onClick={() => handleDownload(latestVersion.version)}
                                            className="bg-white text-slate-900 px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-lg active:scale-95"
                                        >
                                            <Download size={20} /> Download Installer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History List - Timeline Style */}
                    <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 space-y-8">
                        {versions.map((v, index) => (
                            <div key={v.id} className="relative">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[39px] top-6 w-5 h-5 rounded-full border-4 border-slate-50 dark:border-slate-900 ${v.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>

                                <div className={`group bg-white dark:bg-slate-800 rounded-xl p-6 border transition-all ${!v.isActive ? 'opacity-70 border-slate-200 dark:border-slate-800' : 'border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700/50 shadow-sm hover:shadow-md'}`}>
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl font-bold text-slate-800 dark:text-white">v{v.version}</span>
                                                {v.forceUpdate && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                                                        <AlertTriangle size={10} /> Critical
                                                    </span>
                                                )}
                                                {!v.isActive && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 flex items-center gap-1">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                                                <Calendar size={14} /> Released {new Date(v.releaseDate).toLocaleDateString()}
                                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                                <span className="font-mono text-xs opacity-70">#{v.id.substring(0, 8)}</span>
                                            </p>
                                            <div className="text-sm text-slate-600 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                {v.releaseNotes}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start md:self-center">
                                            <button
                                                onClick={() => handleToggleActive(v.id, v.isActive)}
                                                className={`p-2 rounded-lg transition-colors ${v.isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                                title={v.isActive ? "Deactivate" : "Activate"}
                                            >
                                                {v.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                            </button>

                                            <button
                                                onClick={() => handleEditClick(v)}
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={20} />
                                            </button>

                                            <button
                                                onClick={() => handleDownload(v.version)}
                                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <Download size={20} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(v.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Delete"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            <ConfirmModal
                isOpen={!!deleteVersionId}
                onClose={() => setDeleteVersionId(null)}
                onConfirm={confirmDelete}
                title="Delete Version"
                message="Are you sure you want to delete this version?"
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default Updates;
