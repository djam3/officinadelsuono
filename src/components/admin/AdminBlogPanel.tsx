import { useState } from 'react';
import { db } from '../../firebase';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { Plus, Save, X, Edit2, Trash2 } from 'lucide-react';

import { BlogPost } from '../../types/admin';

interface AdminBlogPanelProps {
  blogPosts: BlogPost[];
  manualApiKey: string;
}

export function AdminBlogPanel({ blogPosts, manualApiKey }: AdminBlogPanelProps) {
  const [isEditingBlog, setIsEditingBlog] = useState<string | null>(null);
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [blogForm, setBlogForm] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    category: 'Guide Tecniche',
    author: 'Amerigo',
    date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
    readTime: '5 min',
    image: '',
    content: '',
    featured: false
  });

  const handleSaveBlog = async () => {
    if (!blogForm.title || !blogForm.content || !blogForm.image) {
      alert("Compila i campi obbligatori (Titolo, Contenuto, Immagine)");
      return;
    }

    try {
      const postData = {
        ...blogForm,
        updatedAt: new Date().toISOString()
      };

      if (isEditingBlog) {
        await updateDoc(doc(db, 'blog_posts', isEditingBlog), postData);
      } else {
        await addDoc(collection(db, 'blog_posts'), {
          ...postData,
          createdAt: new Date().toISOString()
        });
      }
      
      setIsEditingBlog(null);
      setIsAddingBlog(false);
      setBlogForm({
        title: '',
        excerpt: '',
        category: 'Guide Tecniche',
        author: 'Amerigo',
        date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
        readTime: '5 min',
        image: '',
        content: '',
        featured: false
      });
    } catch (error) {
      console.error("Error saving blog post:", error);
      alert("Errore durante il salvataggio dell'articolo.");
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo articolo?")) {
      try {
        await deleteDoc(doc(db, 'blog_posts', id));
      } catch (error) {
        console.error("Error deleting blog post:", error);
      }
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-bold">Articoli Blog ({blogPosts.length})</h2>
        <button 
          onClick={() => {
            setIsAddingBlog(true);
            setIsEditingBlog(null);
            setBlogForm({
              title: '',
              excerpt: '',
              category: 'Guide Tecniche',
              author: 'Amerigo',
              date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
              readTime: '5 min',
              image: '',
              content: '',
              featured: false
            });
          }}
          className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuovo Articolo
        </button>
      </div>

      <div className="p-6">
        {(isAddingBlog || isEditingBlog) && (
          <div className="mb-8 p-6 bg-zinc-950 rounded-2xl border border-brand-orange/30 space-y-4">
            <h3 className="text-lg font-bold">{isEditingBlog ? 'Modifica Articolo' : 'Nuovo Articolo'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Titolo Articolo"
                value={blogForm.title}
                onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
              />
              <input
                type="text"
                placeholder="Categoria"
                value={blogForm.category}
                onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
              />
              <input
                type="text"
                placeholder="URL Immagine"
                value={blogForm.image}
                onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
              />
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Tempo di lettura"
                  value={blogForm.readTime}
                  onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blogForm.featured}
                    onChange={(e) => setBlogForm({ ...blogForm, featured: e.target.checked })}
                    className="w-4 h-4 accent-brand-orange"
                  />
                  <span className="text-sm">In Evidenza</span>
                </label>
              </div>
            </div>
            <textarea
              placeholder="Riassunto (Excerpt)"
              value={blogForm.excerpt}
              onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange h-20 resize-none"
            />
            <textarea
              placeholder="Contenuto HTML"
              value={blogForm.content}
              onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-brand-orange h-64"
            />
            <div className="flex justify-end gap-2">
              <button onClick={handleSaveBlog} className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition-colors">
                <Save className="w-4 h-4" /> Salva Articolo
              </button>
              <button 
                onClick={() => {
                  setIsAddingBlog(false);
                  setIsEditingBlog(null);
                }} 
                className="flex items-center gap-2 px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-bold transition-colors"
              >
                <X className="w-4 h-4" /> Annulla
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <div key={post.id} className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
              <div className="h-32 overflow-hidden relative">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                {post.featured && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-brand-orange text-white text-[10px] font-bold rounded uppercase">Featured</span>
                )}
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-sm mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-zinc-500 text-xs line-clamp-2 mb-4">{post.excerpt}</p>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-[10px] text-zinc-600">{post.date}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setIsEditingBlog(post.id);
                        setIsAddingBlog(false);
                        setBlogForm(post);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBlog(post.id)}
                      className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
