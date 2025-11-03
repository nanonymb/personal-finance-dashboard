'use client';

import React, { useState, useEffect } from 'react';
import { useNotes } from '@/app/context/NotesContext';
import { Note } from '@/types/Note';
import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
}

const NotesModal = ({ onClose }: Props) => {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const { t } = useTranslation();
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      await addNote({ content: newNoteContent });
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNoteContent(note.content);
  };

  const handleSaveEdit = async () => {
    if (!editingNote || !newNoteContent.trim()) return;
    try {
      await updateNote({ id: editingNote.id!, content: newNoteContent });
      setEditingNote(null);
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (confirm(t('notes_modal.delete_note_confirm'))) {
      try {
        await deleteNote(id);
        setSelectedNotes(selectedNotes.filter((noteId) => noteId !== id));
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotes.length === 0) return;
    if (confirm(t('notes_modal.delete_selected_confirm'))) {
      try {
        await Promise.all(selectedNotes.map((id) => deleteNote(id)));
        setSelectedNotes([]);
      } catch (err) {
        console.error('Failed to delete selected notes:', err);
      }
    }
  };

  const toggleSelectNote = (id: number) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-auto">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-center h-full pointer-events-none">
        <div className="bg-[rgba(39,51,62,0.7)] p-6 rounded-lg max-w-lg w-full pointer-events-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">{t('notes_modal.title')}</h2>
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-700 text-xl border-none"
              aria-label={t('notes_modal.close')}
            >
              X
            </button>
          </div>
          <div className="mb-4">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder={editingNote ? t('notes_modal.edit_note_placeholder') : t('notes_modal.add_note_placeholder')}
              className="border p-2 w-full rounded text-[var(--foreground)] bg-[rgb(42,49,52)]"
              rows={4}
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={editingNote ? handleSaveEdit : handleAddNote}
                className="bg-[rgb(57,95,106)] text-white px-4 py-2 rounded hover:bg-[rgb(38,63,71)]"
              >
                {editingNote ? t('notes_modal.save_button') : t('notes_modal.add_button')}
              </button>
              {editingNote && (
                <button
                  onClick={() => {
                    setEditingNote(null);
                    setNewNoteContent('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  {t('notes_modal.cancel_button')}
                </button>
              )}
            </div>
          </div>
          <div className="mb-4">
            <button
              onClick={handleDeleteSelected}
              className="bg-[rgb(125,22,4)] text-white px-4 py-2 rounded hover:bg-[rgb(99,22,9)] disabled:bg-gray-500"
              disabled={selectedNotes.length === 0}
              aria-label={t('notes_modal.delete_selected_button')}
            >
              {t('notes_modal.delete_selected_button')}
            </button>
          </div>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-gray-400">{t('notes_modal.no_notes')}</p>
            ) : (
              notes.map((note) => (
                <li
                  key={note.id}
                  className="flex items-center space-x-2 p-2 border-b border-gray-500"
                >
                  <input
                    type="checkbox"
                    checked={selectedNotes.includes(note.id!)}
                    onChange={() => toggleSelectNote(note.id!)}
                    className="h-4 w-4 accent-yellow-600 appearance-auto"
                  />
                  <span
                    className="flex-1 cursor-pointer text-[var(--foreground)]"
                    onClick={() => handleEditNote(note)}
                  >
                    {note.content}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id!)}
                    className="text-red-500 hover:text-red-700 border-none"
                    aria-label={`${t('notes_modal.delete_note_confirm')} ${note.content}`}
                  >
                    🗑️
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;