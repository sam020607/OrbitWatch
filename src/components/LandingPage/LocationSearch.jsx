import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { geocodeSearch } from '../../api/geocodeApi.js';
import { useApp } from '../../context/AppContext.jsx';

/**
 * Location search bar with autocomplete suggestions.
 * Supports city names, addresses, and "lat,lon" coordinate pairs.
 */
export default function LocationSearch({ onLocationSelect, variant, onQueryChange, onCancel }) {
  const { state } = useApp();
  const isHero = variant === 'hero';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Notify parent of query changes
  useEffect(() => {
    if (onQueryChange) {
      onQueryChange(query);
    }
  }, [query, onQueryChange]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError('');
      try {
        const found = await geocodeSearch(query);
        setResults(found);
        setShowDropdown(found.length > 0);
      } catch (e) {
        setError('Search failed. Try again.');
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelect(result) {
    setQuery(result.name || result.display_name);
    setShowDropdown(false);
    setResults([]);
    onLocationSelect({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.name || result.display_name,
      country: result.country || '',
      displayName: result.display_name,
    });
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
    if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[0]);
    }
  }

  function handleGeolocation() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      return;
    }
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        onLocationSelect({ lat, lon, name: 'Your Location', country: '' });
        setIsSearching(false);
      },
      () => {
        setError('Could not get your location. Please search manually.');
        setIsSearching(false);
      },
      { timeout: 8000 }
    );
  }

  if (variant === 'header') {
    return (
      <div className="relative flex items-center shrink-0" ref={dropdownRef}>
        <div className="relative flex items-center bg-surface/90 border border-cyan/40 rounded-lg px-2 py-1 shadow-lg text-[11px] font-sans font-semibold uppercase tracking-wider">
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan animate-spin mr-1.5 shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-cyan mr-1.5 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Type new location..."
            className="bg-transparent border-none outline-none text-text-primary text-[11px] font-semibold uppercase tracking-wider w-36 placeholder-white/30"
            autoFocus
            autoComplete="off"
          />
          <button
            onClick={onCancel}
            className="ml-1.5 p-0.5 rounded hover:bg-white/10 text-muted hover:text-text-primary transition-colors shrink-0"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Header Results Dropdown */}
        {showDropdown && results.length > 0 && (
          <div
            className="absolute top-full left-0 mt-1.5 w-72 glass-panel border border-surface-border overflow-hidden z-[500] rounded-lg shadow-2xl bg-surface/95 backdrop-blur-md"
            role="listbox"
          >
            {results.map((result, idx) => (
              <button
                key={idx}
                role="option"
                onClick={() => handleSelect(result)}
                className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left group border-b border-white/[0.03] last:border-b-0"
              >
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-cyan group-hover:text-white transition-colors" />
                <div className="min-w-0">
                  <p className="text-text-primary text-[10px] font-bold uppercase tracking-wider truncate">
                    {result.name || result.display_name.split(',')[0]}
                  </p>
                  <p className="text-muted text-[8px] truncate uppercase tracking-wider mt-0.5">{result.display_name}</p>
                </div>
                <div className="ml-auto shrink-0">
                  <span className="text-[9px] font-mono text-muted">
                    {parseFloat(result.lat).toFixed(1)}°, {parseFloat(result.lon).toFixed(1)}°
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Search Input */}
      <div className="relative flex items-center">
        {!isHero && (
          <div className="absolute left-4 text-cyan">
            {isSearching
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Search className="w-5 h-5" />
            }
          </div>
        )}

        <input
          ref={inputRef}
          id="location-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Enter city, country, or lat,lon coordinates..."
          className={`w-full py-3.5 sm:py-4 text-text placeholder-muted font-sans text-sm sm:text-base backdrop-blur-md transition-all duration-200 focus:outline-none
            ${isHero 
              ? 'pl-5 sm:pl-6 pr-24 sm:pr-32 bg-[#0d1320]/70 border border-white/15 rounded-full focus:border-white/30 focus:ring-1 focus:ring-white/10' 
              : 'pl-10 sm:pl-12 pr-20 sm:pr-24 bg-navy/80 border border-border rounded-2xl focus:border-cyan focus:ring-1 focus:ring-cyan/50'
            }`}
          style={{ caretColor: isHero ? '#7fb3e0' : '#ff007f' }}
          autoComplete="off"
          aria-label="Location search"
          aria-autocomplete="list"
          aria-controls="location-dropdown"
        />

        {/* Buttons */}
        <div className="absolute right-2 flex items-center gap-1 sm:gap-1.5">
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}
              className="p-1 sm:p-2 text-muted hover:text-text transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5 sm:w-4 h-4" />
            </button>
          )}
          
          {isHero ? (
            <>
              <button
                onClick={handleGeolocation}
                className="p-1 sm:p-2 text-slate-400 hover:text-white transition-colors"
                title="Use my current location"
                aria-label="Use current location"
              >
                <MapPin className="w-4 h-4 sm:w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  if (results.length > 0) {
                    handleSelect(results[0]);
                  } else if (query.trim()) {
                    geocodeSearch(query).then(found => {
                      if (found && found.length > 0) {
                        handleSelect(found[0]);
                      }
                    });
                  }
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f5f7fa]/90 hover:bg-white text-[#070a12] flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 shrink-0"
                title="Submit Search"
                aria-label="Submit search"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleGeolocation}
              className="p-1.5 sm:p-2 text-cyan hover:text-white transition-colors"
              title="Use my current location"
              aria-label="Use current location"
            >
              <MapPin className="w-4 h-4 sm:w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-red-400 text-sm font-crimson font-semibold text-center">{error}</p>
      )}

      {/* Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          id="location-dropdown"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 glass-panel border border-border overflow-hidden z-50 rounded-xl"
        >
          {results.map((result, idx) => (
            <button
              key={idx}
              role="option"
              onClick={() => handleSelect(result)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-panel-light transition-colors text-left group"
            >
              <MapPin className={`w-4 h-4 mt-0.5 shrink-0 group-hover:text-white transition-colors ${isHero ? 'text-[#7fb3e0]' : 'text-cyan'}`} />
              <div className="min-w-0">
                <p className="text-text text-sm font-medium truncate">
                  {result.name || result.display_name.split(',')[0]}
                </p>
                <p className="text-muted text-xs truncate">{result.display_name}</p>
              </div>
              <div className="ml-auto shrink-0">
                <span className="text-xs font-mono text-muted">
                  {parseFloat(result.lat).toFixed(2)}°, {parseFloat(result.lon).toFixed(2)}°
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
