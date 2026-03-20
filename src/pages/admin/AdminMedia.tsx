import React, { useState } from 'react';
import { UploadCloud, Search, CheckCircle2 } from 'lucide-react';

export default function AdminMedia() {
  const [selectedId, setSelectedId] = useState<number | null>(2);

  const images = [
    { id: 1, url: 'https://picsum.photos/seed/minimalist/400/400', name: 'hero-image.jpg' },
    { id: 2, url: 'https://picsum.photos/seed/architecture/400/400', name: 'brutalist-arch.jpg' },
    { id: 3, url: 'https://picsum.photos/seed/ceramics/400/400', name: 'ceramics-bowl.jpg' },
    { id: 4, url: 'https://picsum.photos/seed/workspace/400/400', name: 'desk-setup.jpg' },
    { id: 5, url: 'https://picsum.photos/seed/portrait/400/400', name: 'author-portrait.jpg' },
    { id: 6, url: 'https://picsum.photos/seed/ecommerce/400/400', name: 'shop-preview.jpg' },
    { id: 7, url: 'https://picsum.photos/seed/editorial/400/400', name: 'magazine-spread.jpg' },
    { id: 8, url: 'https://picsum.photos/seed/branding/400/400', name: 'coffee-brand.jpg' },
  ];

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-ink">Media Library</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
          <input 
            type="text" 
            placeholder="Search images..." 
            className="w-full bg-white border border-subtle rounded-lg pl-10 pr-4 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-accent/30 bg-accent/5 rounded-xl p-12 flex flex-col items-center justify-center text-center mb-12 hover:border-accent/60 transition-colors cursor-pointer">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <UploadCloud size={28} className="text-accent" />
        </div>
        <h3 className="text-lg font-medium text-ink mb-1">Upload New Media</h3>
        <p className="text-ink/60 text-sm">Drag and drop your images here, or click to browse files.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {images.map((img) => {
          const isSelected = selectedId === img.id;
          return (
            <div 
              key={img.id} 
              onClick={() => setSelectedId(img.id)}
              className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group ${
                isSelected ? 'border-[3px] border-accent shadow-md' : 'border border-subtle hover:border-accent/50'
              }`}
            >
              <img 
                src={img.url} 
                alt={img.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Overlay for unselected on hover */}
              {!isSelected && (
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors" />
              )}
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-white rounded-full text-accent shadow-sm">
                  <CheckCircle2 size={24} className="fill-white" />
                </div>
              )}
              {/* Filename */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                <p className="text-white text-xs truncate">{img.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
