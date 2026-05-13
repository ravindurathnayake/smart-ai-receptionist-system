import React from 'react';

const ConfirmModal = ({ 
    isOpen, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    onConfirm, 
    onCancel, 
    type = "info" 
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning': return 'report_problem';
            case 'danger':
            case 'error': return 'error';
            case 'success': return 'check_circle';
            default: return 'info';
        }
    };

    const getTypeClasses = () => {
        switch (type) {
            case 'warning': return 'bg-warning-container text-on-warning-container';
            case 'danger':
            case 'error': return 'bg-error-container text-on-error-container';
            case 'success': return 'bg-secondary-container text-on-secondary-container';
            default: return 'bg-primary-container text-on-primary-container';
        }
    };

    const getConfirmButtonClasses = () => {
        switch (type) {
            case 'warning': return 'bg-warning text-white hover:opacity-90';
            case 'danger':
            case 'error': return 'bg-error text-white hover:opacity-90';
            case 'success': return 'bg-secondary text-white hover:opacity-90';
            default: return 'bg-primary text-white hover:opacity-90';
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300 border border-outline-variant/10">
                <div className={`p-8 flex items-center gap-4 ${getTypeClasses()}`}>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl">{getIcon()}</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold font-headline">{title}</h3>
                    </div>
                </div>
                
                <div className="p-8 space-y-8">
                    <p className="text-on-surface-variant font-medium leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-4">
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="flex-1 py-4 rounded-2xl font-bold text-outline hover:bg-slate-100 transition-all border border-slate-200"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={onConfirm}
                            className={`flex-[2] py-4 rounded-2xl font-bold transition-all shadow-lg ${getConfirmButtonClasses()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
