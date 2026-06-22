import React from "react";
import { Country } from "country-state-city";

interface CountryFlagProps {
  /** Full country name, e.g. "Canada", "Nigeria" */
  country: string;
  /** Display height in pixels (default 20). Snapped to nearest valid CDN size. */
  size?: number;
  className?: string;
}

/** Resolves a country name to its ISO 3166-1 alpha-2 code (loose/substring match). */
const getCountryIsoCode = (countryName: string): string | null => {
  if (!countryName) return null;
  const lowerName = countryName.toLowerCase();
  const allCountries = Country.getAllCountries();
  const exact = allCountries.find((c) => c.name.toLowerCase() === lowerName);
  if (exact) return exact.isoCode;
  const partial = allCountries.find(
    (c) =>
      c.name.toLowerCase().includes(lowerName) ||
      lowerName.includes(c.name.toLowerCase()),
  );
  return partial ? partial.isoCode : null;
};

// flagcdn.com only serves flat PNGs at these fixed heights.
const VALID_HEIGHTS = [20, 24, 40, 60, 80, 120, 240];

const snapToValidHeight = (n: number): number =>
  VALID_HEIGHTS.reduce((prev, curr) =>
    Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev,
  );

/**
 * Renders a flat country flag image from flagcdn.com given a full country
 * name. Silently renders nothing if the country can't be resolved to an
 * ISO code.
 */
export const CountryFlag: React.FC<CountryFlagProps> = ({
  country,
  size = 20,
  className = "",
}) => {
  if (!country) return null;

  const isoCode = getCountryIsoCode(country);
  if (!isoCode) return null;

  const code = isoCode.toLowerCase();
  const cdnH = snapToValidHeight(size);
  const cdnH2 = snapToValidHeight(size * 2);
  const displayW = Math.round(size * 1.5);

  return (
    <img
      src={`https://flagcdn.com/h${cdnH}/${code}.png`}
      srcSet={`https://flagcdn.com/h${cdnH2}/${code}.png 2x`}
      alt={country}
      title={country}
      style={{ height: size, width: displayW, verticalAlign: "middle" }}
      className={`inline-block shrink-0 rounded-none object-cover shadow-xs ${className}`}
      loading="lazy"
    />
  );
};

export default CountryFlag;
