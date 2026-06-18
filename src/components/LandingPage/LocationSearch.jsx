import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { geocodeSearch } from '../../api/geocodeApi.js';
import { useApp } from '../../context/AppContext.jsx';

/**
 * Location search bar with autocomplete suggestions.
 * Supports city names, addresses, and "lat,lon" coordinate pairs.
 */
export default function LocationSearch({ onLocationSelect }) {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

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
    }, 400);

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

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-4 text-cyan">
          {isSearching
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Search className="w-5 h-5" />
          }
        </div>

        <input
          ref={inputRef}
          id="location-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Enter city, country, or lat,lon coordinates..."
          className="w-full pl-12 pr-24 py-4 bg-navy/80 border border-border rounded-2xl
                     text-text placeholder-muted font-sans text-base
                     focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/50
                     backdrop-blur-md transition-all duration-200"
          style={{ caretColor: '#00d4ff' }}
          autoComplete="off"
          aria-label="Location search"
          aria-autocomplete="list"
          aria-controls="location-dropdown"
        />

        {/* Buttons */}
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}
              className="p-2 text-muted hover:text-text transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleGeolocation}
            className="p-2 text-cyan hover:text-white transition-colors"
            title="Use my current location"
            aria-label="Use current location"
          >
            <MapPin className="w-5 h-5" />
          </button>
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
          className="absolute top-full left-0 right-0 mt-2 glass-panel border border-border overflow-hidden z-50"
        >
          {results.map((result, idx) => (
            <button
              key={idx}
              role="option"
              onClick={() => handleSelect(result)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-panel-light transition-colors text-left group"
            >
              <MapPin className="w-4 h-4 text-cyan mt-0.5 shrink-0 group-hover:text-white transition-colors" />
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
