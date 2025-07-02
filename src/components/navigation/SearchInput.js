import React from 'react';

const SearchInput = ({ 
  id, 
  value, 
  onChange, 
  onKeyPress, 
  placeholder, 
  label,
  showSuggestions,
  suggestions,
  onSuggestionSelect,
  onFocus
}) => {
  return (
    <div className="input-field">
      <label htmlFor={id}>{label}</label>
      <div className="input-container">
        <input
          type="text"
          id={id}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          placeholder={placeholder}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${suggestion.isError ? 'error' : ''}`}
                onClick={() => onSuggestionSelect(suggestion)}
              >
                <div className="suggestion-address">
                  {suggestion.icon && <span className="suggestion-icon">{suggestion.icon}</span>}
                  <div className="suggestion-text">
                    {suggestion.placeName && <div className="suggestion-place-name">{suggestion.placeName}</div>}
                    <div className="suggestion-address-text">{suggestion.address}</div>
                    {suggestion.region && <div className="suggestion-region">{suggestion.region}</div>}
                  </div>
                </div>
                {suggestion.roadAddress && suggestion.roadAddress !== suggestion.address && !suggestion.isError && (
                  <div className="suggestion-detail">{suggestion.roadAddress}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInput; 