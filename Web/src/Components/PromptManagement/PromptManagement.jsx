import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    CheckCircle,
    Edit,
    FileText,
    Plus,
    RefreshCw,
    Save,
    Trash2,
    X
} from 'lucide-react';
import promptManagementApi from '../../services/promptManagementService';

const emptySchemaForm = {
    tableName: '',
    schemaPrompt: ''
};

const emptyMainForm = {
    promptName: '',
    prompt: ''
};

const entityConfig = {
    schema: {
        title: 'Schema Prompt',
        sectionTitle: 'Schema Prompt Management',
        addLabel: 'Add Schema Prompt',
        nameLabel: 'Table Name',
        nameField: 'tableName',
        promptLabel: 'Schema Prompt',
        promptField: 'schemaPrompt',
        emptyForm: emptySchemaForm
    },
    main: {
        title: 'Main Prompt',
        sectionTitle: 'Main Prompt Management',
        addLabel: 'Add Main Prompt',
        nameLabel: 'Prompt Name',
        nameField: 'promptName',
        promptLabel: 'Prompt',
        promptField: 'prompt',
        emptyForm: emptyMainForm
    }
};

const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content)) return data.content;
    return [];
};

const getErrorMessage = (error, fallback) => {
    const responseMessage = error?.response?.data?.message || error?.response?.data?.error || error?.response?.data;

    if (typeof responseMessage === 'string') return responseMessage;

    return error?.message || fallback;
};

const ToastNotification = ({ notification, onClose }) => {
    if (!notification) return null;

    const isSuccess = notification.type === 'success';

    return (
        <div className="fixed top-6 right-6 z-50 w-[calc(100vw-48px)] max-w-md">
            <div className={`bg-white rounded-xl shadow-2xl border ${isSuccess ? 'border-green-200' : 'border-red-200'} overflow-hidden`}>
                <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isSuccess ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{isSuccess ? 'Success' : 'Error'}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-all" aria-label="Close notification">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalShell = ({ show, title, maxWidth = 'max-w-3xl', children, footer, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[92vh] flex flex-col overflow-hidden`}>
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-all" aria-label="Close modal">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                {children}
                {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">{footer}</div>}
            </div>
        </div>
    );
};

const AddPromptModal = ({ show, type, form, saving, onChange, onSubmit, onClose }) => {
    if (!type) return null;

    const config = entityConfig[type];

    return (
        <ModalShell
            show={show}
            title={config.addLabel}
            onClose={saving ? undefined : onClose}
            footer={(
                <>
                    <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-all disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="submit" form="prompt-add-form" disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center gap-2">
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </>
            )}
        >
            <form id="prompt-add-form" onSubmit={onSubmit}>
                <div className="p-6 overflow-y-auto">
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{config.nameLabel}</label>
                        <input
                            type="text"
                            value={form[config.nameField]}
                            onChange={(event) => onChange(config.nameField, event.target.value)}
                            placeholder={`Enter ${config.nameLabel.toLowerCase()}`}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{config.promptLabel}</label>
                        <textarea
                            value={form[config.promptField]}
                            onChange={(event) => onChange(config.promptField, event.target.value)}
                            placeholder={`Enter ${config.promptLabel.toLowerCase()}`}
                            rows={10}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900 resize-y min-h-[260px] font-mono text-sm leading-6"
                            required
                        />
                    </div>
                </div>
            </form>
        </ModalShell>
    );
};

const PromptDetailsModal = ({ show, type, item, prompt, updating, onPromptChange, onSave, onClose }) => {
    if (!type || !item) return null;

    const config = entityConfig[type];

    return (
        <ModalShell
            show={show}
            title="Prompt Details"
            maxWidth="max-w-6xl"
            onClose={updating ? undefined : onClose}
            footer={(
                <>
                    <button type="button" onClick={onClose} disabled={updating} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-all disabled:opacity-60">
                        Close
                    </button>
                    <button type="button" onClick={onSave} disabled={updating} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center gap-2">
                        {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </>
            )}
        >
            <div className="p-6 overflow-y-auto">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-1">{config.title}</p>
                    <p className="text-base font-semibold text-gray-900 mb-0">{config.nameLabel}: {item[config.nameField] || 'N/A'}</p>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">Prompt Content</label>
                <textarea
                    value={prompt}
                    onChange={(event) => onPromptChange(event.target.value)}
                    rows={18}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900 resize-y min-h-[430px] font-mono text-sm leading-6 bg-gray-50"
                />
            </div>
        </ModalShell>
    );
};

const DeleteConfirmModal = ({ show, deleting, onDelete, onClose }) => (
    <ModalShell
        show={show}
        title="Delete Prompt"
        maxWidth="max-w-lg"
        onClose={deleting ? undefined : onClose}
        footer={(
            <>
                <button type="button" onClick={onClose} disabled={deleting} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-all disabled:opacity-60">
                    Cancel
                </button>
                <button type="button" onClick={onDelete} disabled={deleting} className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-60 flex items-center gap-2">
                    {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                </button>
            </>
        )}
    >
        <div className="p-6">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <p className="font-bold text-gray-900 mb-1">Are you sure you want to delete this prompt?</p>
                    <p className="text-sm text-gray-500 mb-0">This action cannot be undone.</p>
                </div>
            </div>
        </div>
    </ModalShell>
);

const StatCard = ({ label, value, colorClass, iconBgClass }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClass}`}>
                <FileText className="w-6 h-6" />
            </div>
        </div>
    </div>
);

const PromptTableCard = ({ type, items, loading, busy, onAdd, onView, onEdit, onDelete }) => {
    const config = entityConfig[type];
    const iconClass = type === 'schema' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600';

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-0">{config.sectionTitle}</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-0">{type === 'schema' ? 'Table-aware schema instructions' : 'Application-level AI prompt instructions'}</p>
                    </div>
                </div>

                <button type="button" onClick={onAdd} disabled={busy} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-60">
                    <Plus className="w-4 h-4" />
                    {config.addLabel}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mr-3" />
                    <span className="font-semibold text-gray-600">Loading prompts...</span>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{config.nameLabel}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prompt Preview</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        No prompts available
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-all">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item[config.nameField] || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                type="button"
                                                onClick={() => onView(item)}
                                                disabled={!item[config.promptField] || busy}
                                                className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-all disabled:text-gray-400 disabled:no-underline"
                                            >
                                                View Prompt
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button type="button" onClick={() => onEdit(item)} disabled={busy} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50" aria-label={`Edit ${item[config.nameField]}`}>
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => onDelete(item)} disabled={busy} className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all disabled:opacity-50" aria-label={`Delete ${item[config.nameField]}`}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

const PromptManagement = () => {
    const [schemaPrompts, setSchemaPrompts] = useState([]);
    const [mainPrompts, setMainPrompts] = useState([]);
    const [loadingSchema, setLoadingSchema] = useState(false);
    const [loadingMain, setLoadingMain] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [notification, setNotification] = useState(null);
    const [addModalType, setAddModalType] = useState(null);
    const [addForm, setAddForm] = useState(emptySchemaForm);
    const [detailsModal, setDetailsModal] = useState({
        show: false,
        type: null,
        item: null,
        prompt: ''
    });
    const [deleteTarget, setDeleteTarget] = useState({
        show: false,
        type: null,
        item: null
    });

    const stats = useMemo(() => ([
        {
            label: 'Schema Prompts Count',
            value: schemaPrompts.length,
            colorClass: 'text-blue-600',
            iconBgClass: 'bg-blue-50 text-blue-600'
        },
        {
            label: 'Main Prompts Count',
            value: mainPrompts.length,
            colorClass: 'text-emerald-600',
            iconBgClass: 'bg-emerald-50 text-emerald-600'
        }
    ]), [schemaPrompts.length, mainPrompts.length]);

    const showNotification = useCallback((type, message) => {
        setNotification({ type, message });
    }, []);

    const loadSchemaPrompts = useCallback(async () => {
        setLoadingSchema(true);
        try {
            const data = await promptManagementApi.getSchemaPrompts();
            setSchemaPrompts(normalizeList(data));
        } catch (error) {
            showNotification('error', getErrorMessage(error, 'Failed to load schema prompts'));
        } finally {
            setLoadingSchema(false);
        }
    }, [showNotification]);

    const loadMainPrompts = useCallback(async () => {
        setLoadingMain(true);
        try {
            const data = await promptManagementApi.getMainPrompts();
            setMainPrompts(normalizeList(data));
        } catch (error) {
            showNotification('error', getErrorMessage(error, 'Failed to load main prompts'));
        } finally {
            setLoadingMain(false);
        }
    }, [showNotification]);

    const refreshAll = useCallback(async () => {
        await Promise.all([loadSchemaPrompts(), loadMainPrompts()]);
    }, [loadSchemaPrompts, loadMainPrompts]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const openAddModal = (type) => {
        setAddModalType(type);
        setAddForm(entityConfig[type].emptyForm);
    };

    const closeAddModal = () => {
        if (saving) return;

        setAddModalType(null);
        setAddForm(emptySchemaForm);
    };

    const handleAddFormChange = (field, value) => {
        setAddForm((current) => ({ ...current, [field]: value }));
    };

    const handleAddSubmit = async (event) => {
        event.preventDefault();
        if (!addModalType) return;

        setSaving(true);

        try {
            if (addModalType === 'schema') {
                await promptManagementApi.createSchemaPrompt({
                    tableName: addForm.tableName.trim(),
                    schemaPrompt: addForm.schemaPrompt.trim()
                });
                await loadSchemaPrompts();
                showNotification('success', 'Schema prompt saved successfully');
            } else {
                await promptManagementApi.createMainPrompt({
                    promptName: addForm.promptName.trim(),
                    prompt: addForm.prompt.trim()
                });
                await loadMainPrompts();
                showNotification('success', 'Main prompt saved successfully');
            }

            setAddModalType(null);
            setAddForm(emptySchemaForm);
        } catch (error) {
            showNotification('error', getErrorMessage(error, 'Failed to save prompt'));
        } finally {
            setSaving(false);
        }
    };

    const openDetailsModal = (type, item) => {
        const config = entityConfig[type];

        setDetailsModal({
            show: true,
            type,
            item,
            prompt: item[config.promptField] || ''
        });
    };

    const closeDetailsModal = () => {
        if (updating) return;

        setDetailsModal({
            show: false,
            type: null,
            item: null,
            prompt: ''
        });
    };

    const handleDetailsSave = async () => {
        const { type, item, prompt } = detailsModal;
        if (!type || !item) return;

        setUpdating(true);

        try {
            if (type === 'schema') {
                await promptManagementApi.updateSchemaPrompt(item.id, {
                    tableName: item.tableName,
                    schemaPrompt: prompt.trim()
                });
                await loadSchemaPrompts();
                showNotification('success', 'Schema prompt updated successfully');
            } else {
                await promptManagementApi.updateMainPrompt(item.id, {
                    promptName: item.promptName,
                    prompt: prompt.trim()
                });
                await loadMainPrompts();
                showNotification('success', 'Main prompt updated successfully');
            }

            setDetailsModal({
                show: false,
                type: null,
                item: null,
                prompt: ''
            });
        } catch (error) {
            showNotification('error', getErrorMessage(error, 'Failed to update prompt'));
        } finally {
            setUpdating(false);
        }
    };

    const openDeleteModal = (type, item) => {
        setDeleteTarget({
            show: true,
            type,
            item
        });
    };

    const closeDeleteModal = () => {
        if (deleting) return;

        setDeleteTarget({
            show: false,
            type: null,
            item: null
        });
    };

    const handleDelete = async () => {
        const { type, item } = deleteTarget;
        if (!type || !item) return;

        setDeleting(true);

        try {
            if (type === 'schema') {
                await promptManagementApi.deleteSchemaPrompt(item.id);
                await loadSchemaPrompts();
                showNotification('success', 'Schema prompt deleted successfully');
            } else {
                await promptManagementApi.deleteMainPrompt(item.id);
                await loadMainPrompts();
                showNotification('success', 'Main prompt deleted successfully');
            }

            setDeleteTarget({
                show: false,
                type: null,
                item: null
            });
        } catch (error) {
            showNotification('error', getErrorMessage(error, 'Failed to delete prompt'));
        } finally {
            setDeleting(false);
        }
    };

    const isLoading = loadingSchema || loadingMain;
    const isBusy = saving || updating || deleting;

    return (
        <div>
            <ToastNotification notification={notification} onClose={() => setNotification(null)} />

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Prompt Management</h2>
                    <p className="text-gray-500 mt-1">Maintain schema and main prompts used by Spatial OMS.</p>
                </div>
                <button
                    type="button"
                    onClick={refreshAll}
                    disabled={isLoading || isBusy}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {stats.map((item) => (
                    <StatCard key={item.label} {...item} />
                ))}
            </div>

            <PromptTableCard
                type="schema"
                items={schemaPrompts}
                loading={loadingSchema}
                busy={isBusy}
                onAdd={() => openAddModal('schema')}
                onView={(item) => openDetailsModal('schema', item)}
                onEdit={(item) => openDetailsModal('schema', item)}
                onDelete={(item) => openDeleteModal('schema', item)}
            />

            <PromptTableCard
                type="main"
                items={mainPrompts}
                loading={loadingMain}
                busy={isBusy}
                onAdd={() => openAddModal('main')}
                onView={(item) => openDetailsModal('main', item)}
                onEdit={(item) => openDetailsModal('main', item)}
                onDelete={(item) => openDeleteModal('main', item)}
            />

            <AddPromptModal
                show={Boolean(addModalType)}
                type={addModalType}
                form={addForm}
                saving={saving}
                onChange={handleAddFormChange}
                onSubmit={handleAddSubmit}
                onClose={closeAddModal}
            />

            <PromptDetailsModal
                show={detailsModal.show}
                type={detailsModal.type}
                item={detailsModal.item}
                prompt={detailsModal.prompt}
                updating={updating}
                onPromptChange={(prompt) => setDetailsModal((current) => ({ ...current, prompt }))}
                onSave={handleDetailsSave}
                onClose={closeDetailsModal}
            />

            <DeleteConfirmModal
                show={deleteTarget.show}
                deleting={deleting}
                onDelete={handleDelete}
                onClose={closeDeleteModal}
            />
        </div>
    );
};

export default PromptManagement;
