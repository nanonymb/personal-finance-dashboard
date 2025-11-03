'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Note } from '@/types/Note';
import { NoteState } from '@/types/AppState';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id'>) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<NoteState['notes']>([]);

  useEffect(() => {
    if (isTauri) {
      invoke<Note[]>('get_notes')
        .then((fetchedNotes) => {
          console.log('Fetched notes:', fetchedNotes);
          setNotes(fetchedNotes);
        })
        .catch((err) => console.error('Failed to fetch notes:', err));
    } else {
      console.warn('Running in browser, using mock notes data');
      setNotes([]);
    }
  }, []);

  const addNote = async (note: Omit<Note, 'id'>) => {
    if (!isTauri) {
      console.warn('Tauri not available, skipping addNote');
      return;
    }
    try {
      await invoke('add_note', { note });
      const updatedNotes = await invoke<Note[]>('get_notes');
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Failed to add note:', err);
      throw err;
    }
  };

  const updateNote = async (note: Note) => {
    if (!isTauri) {
      console.warn('Tauri not available, skipping updateNote');
      return;
    }
    try {
      await invoke('update_note', { note });
      const updatedNotes = await invoke<Note[]>('get_notes');
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Failed to update note:', err);
      throw err;
    }
  };

  const deleteNote = async (id: number) => {
    if (!isTauri) {
      console.warn('Tauri not available, skipping deleteNote');
      return;
    }
    try {
      await invoke('delete_note', { id });
      const updatedNotes = await invoke<Note[]>('get_notes');
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Failed to delete note:', err);
      throw err;
    }
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};