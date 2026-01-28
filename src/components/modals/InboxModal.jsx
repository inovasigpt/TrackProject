import { useState, useEffect } from 'react';
import { X, Inbox, ArrowLeft, Circle, Mail, MailOpen, Clock } from 'lucide-react';

// Format relative time
const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date('2026-01-28T10:00:00'); // Use simulated current time
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins}m`;
    } else if (diffHours < 24) {
        return `${diffHours}h`;
    } else if (diffDays === 1) {
        return 'Kemarin';
    } else if (diffDays < 7) {
        return `${diffDays}d`;
    } else {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    }
};

// Format full date time
const formatFullDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const InboxSlideOver = ({ isOpen, onClose, messages, onMarkAsRead }) => {
    const [selectedMessage, setSelectedMessage] = useState(null);

    // Reset selected message when slide-over closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedMessage(null);
        }
    }, [isOpen]);

    // Handle message click
    const handleMessageClick = (message) => {
        setSelectedMessage(message);
        if (!message.isRead) {
            onMarkAsRead(message.id);
        }
    };

    // Handle back to list
    const handleBack = () => {
        setSelectedMessage(null);
    };

    // Sort messages by timestamp (newest first)
    const sortedMessages = [...messages].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    const unreadCount = messages.filter(m => !m.isRead).length;

    return (
        <aside
            className={`
                bg-[#0f172a]/95 backdrop-blur-xl border-l border-[#1e293b] 
                flex flex-col shrink-0 z-50 transition-all duration-300 
                fixed top-16 bottom-0 right-0 
                ${isOpen ? 'w-80' : 'w-0 opacity-0 pointer-events-none'}
            `}
        >
            {/* Header */}
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {selectedMessage ? (
                        <button
                            onClick={handleBack}
                            className="h-7 w-7 rounded bg-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={14} />
                        </button>
                    ) : (
                        <Inbox size={16} className="text-purple-400" />
                    )}
                    <div>
                        <h3 className="text-white text-[10px] font-black uppercase tracking-widest">
                            {selectedMessage ? 'Detail Pesan' : 'Inbox'}
                        </h3>
                        {!selectedMessage && (
                            <p className="text-[8px] text-slate-500 font-medium">
                                {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedMessage ? (
                    /* Detail View */
                    <div className="p-4 space-y-4">
                        {/* Sender Info */}
                        <div className="flex items-center gap-3">
                            <img
                                src={selectedMessage.from.avatar}
                                alt={selectedMessage.from.name}
                                className="w-10 h-10 rounded-lg border border-purple-500/30 object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-[11px] font-bold truncate">
                                    {selectedMessage.from.name}
                                </p>
                                <p className="text-purple-400 text-[8px] font-black uppercase tracking-widest">
                                    {selectedMessage.from.role}
                                </p>
                            </div>
                        </div>

                        {/* Subject */}
                        <h4 className="text-white text-[11px] font-bold leading-tight">
                            {selectedMessage.subject}
                        </h4>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-slate-500 text-[8px]">
                            <Clock size={10} />
                            <span>{formatFullDateTime(selectedMessage.timestamp)}</span>
                        </div>

                        {/* Body */}
                        <div className="p-3 bg-[#020617]/60 border border-[#1e293b] rounded-lg">
                            <p className="text-slate-300 text-[10px] leading-relaxed whitespace-pre-wrap">
                                {selectedMessage.body}
                            </p>
                        </div>

                        {/* Back Button */}
                        <button
                            onClick={handleBack}
                            className="w-full py-2 bg-[#1e293b] text-slate-400 text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-purple-500/20 hover:text-purple-400 transition-all flex items-center justify-center gap-1"
                        >
                            <ArrowLeft size={12} />
                            Kembali
                        </button>
                    </div>
                ) : (
                    /* List View */
                    <div className="divide-y divide-[#1e293b]">
                        {sortedMessages.length === 0 ? (
                            <div className="p-6 text-center">
                                <Inbox size={32} className="text-slate-700 mx-auto mb-2" />
                                <p className="text-slate-600 text-[10px]">Tidak ada pesan</p>
                            </div>
                        ) : (
                            sortedMessages.map(message => (
                                <button
                                    key={message.id}
                                    onClick={() => handleMessageClick(message)}
                                    className={`w-full p-3 text-left hover:bg-[#020617]/50 transition-colors flex items-start gap-2 ${!message.isRead ? 'bg-purple-500/5' : ''}`}
                                >
                                    {/* Unread indicator */}
                                    <div className="pt-1 shrink-0 w-2">
                                        {!message.isRead && (
                                            <Circle size={6} className="text-purple-500 fill-purple-500" />
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <img
                                        src={message.from.avatar}
                                        alt={message.from.name}
                                        className="w-8 h-8 rounded border border-[#1e293b] object-cover shrink-0"
                                    />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <p className={`text-[10px] truncate ${!message.isRead ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                                                {message.from.name}
                                            </p>
                                            <span className="text-[8px] text-slate-500 font-mono shrink-0">
                                                {formatRelativeTime(message.timestamp)}
                                            </span>
                                        </div>
                                        <p className={`text-[9px] mb-0.5 truncate ${!message.isRead ? 'text-white font-semibold' : 'text-slate-400'}`}>
                                            {message.subject}
                                        </p>
                                        <p className="text-[8px] text-slate-600 truncate">
                                            {message.preview}
                                        </p>
                                    </div>

                                    {/* Mail icon */}
                                    <div className="pt-0.5 shrink-0">
                                        {!message.isRead ? (
                                            <Mail size={12} className="text-purple-400" />
                                        ) : (
                                            <MailOpen size={12} className="text-slate-600" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default InboxSlideOver;
