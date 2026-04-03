import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface BuilderContextType {
  isAdmin: boolean;
  isBuilderMode: boolean;
  activateBuilderMode: () => void;
  deactivateBuilderMode: () => void;
  pageId: string | null;
  setPageId: (id: string | null) => void;
  content: Record<string, any>;
  updateContent: (key: string, value: any) => void;
  saveContent: () => Promise<void>;
  isDirty: boolean;
  isLoading: boolean;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, any>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check sessionStorage (password-based auth — no Firebase required)
    const check = () => {
      const logged = sessionStorage.getItem('admin_logged_in') === 'true';
      setIsAdmin(logged);
      // Restore builder mode if it was active before page reload
      if (logged && sessionStorage.getItem('builder_mode_active') === 'true') {
        setIsBuilderMode(true);
      } else if (!logged) {
        setIsBuilderMode(false);
      }
    };
    check();
    // Re-check when storage changes (e.g. login in another tab)
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const activateBuilderMode = () => {
    if (!isAdmin) return;
    setIsBuilderMode(true);
    sessionStorage.setItem('builder_mode_active', 'true');
  };

  const deactivateBuilderMode = () => {
    setIsBuilderMode(false);
    sessionStorage.removeItem('builder_mode_active');
  };

  // Fetch page content when pageId changes
  useEffect(() => {
    if (!pageId) {
      setContent({});
      setIsDirty(false);
      return;
    }

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const docName = pageId === 'home' ? 'site_content' : `site_content_${pageId}`;
        const docRef = doc(db, 'settings', docName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data());
        } else {
          // If page not saved yet in new format, start fresh
          setContent({});
        }
      } catch (err) {
        console.error(`Error loading page content for ${pageId}:`, err);
      } finally {
        setIsLoading(false);
        setIsDirty(false); // Clean on load
      }
    };

    fetchContent();
  }, [pageId]);

  const updateContent = (key: string, value: any) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const saveContent = async () => {
    if (!pageId || !isAdmin) return;
    try {
      setIsLoading(true);
      const docName = pageId === 'home' ? 'site_content' : `site_content_${pageId}`;
      const docRef = doc(db, 'settings', docName);
      // Merge with existing document, or create new if not exist
      await setDoc(docRef, content, { merge: true });
      setIsDirty(false);
    } catch (err) {
      console.error(`Error saving content for ${pageId}:`, err);
      alert('Errore durante il salvataggio dei contenuti al Database');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BuilderContext.Provider value={{ isAdmin, isBuilderMode, activateBuilderMode, deactivateBuilderMode, pageId, setPageId, content, updateContent, saveContent, isDirty, isLoading }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return context;
}
