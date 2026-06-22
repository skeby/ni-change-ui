import { useMemo } from "react";
import { useAppSelector } from "../../state/store";
import type { ChangeRequest } from "../../state/slices/changes-slice";
import type { ChangeCategoryKind } from "../../state/slices/settings-slice";

export interface OfficeBreakdown {
  office: string;
  count: number;
}

export interface CountryData {
  country: string;
  count: number;
  offices: OfficeBreakdown[];
  kindCounts: Record<ChangeCategoryKind, number>;
  riskCounts: Record<string, number>;
  recent: ChangeRequest[];
}

// Splits "City, Country" into its parts. Falls back to treating the whole
// string as the country when there's no comma (defensive — every seeded
// user profile has the "City, Country" shape).
const splitOfficeLocation = (
  officeLocation: string,
): { office: string; country: string } => {
  const idx = officeLocation.lastIndexOf(",");
  if (idx === -1) return { office: officeLocation, country: officeLocation };
  return {
    office: officeLocation.slice(0, idx).trim(),
    country: officeLocation.slice(idx + 1).trim(),
  };
};

/**
 * Aggregates change requests by the submitter's office country, for the
 * Change Map page. Office location comes from UserProfile.officeLocation
 * (e.g. "Ottawa, Canada") — there's no dedicated countries/offices registry
 * in this app, so user profiles are the source of truth.
 */
export const useChangesByOffice = () => {
  const { changes } = useAppSelector((state) => state.changes);
  const { categories } = useAppSelector((state) => state.settings);
  const { users } = useAppSelector((state) => state.auth);

  return useMemo(() => {
    const kindByCategory: Record<string, ChangeCategoryKind> = {};
    categories.forEach((c) => {
      kindByCategory[c.name] = c.kind;
    });

    const userById: Record<string, (typeof users)[number]> = {};
    users.forEach((u) => {
      userById[u.id] = u;
    });

    const byCountry: Record<string, CountryData> = {};

    changes
      .filter((c) => !c.id.startsWith("DRAFT"))
      .forEach((change) => {
        const officeLocation = userById[change.submitterId]?.officeLocation;
        if (!officeLocation) return;

        const { office, country } = splitOfficeLocation(officeLocation);

        if (!byCountry[country]) {
          byCountry[country] = {
            country,
            count: 0,
            offices: [],
            kindCounts: {
              ai_license: 0,
              ai_build: 0,
              update_existing: 0,
              new_system: 0,
            },
            riskCounts: {},
            recent: [],
          };
        }
        const data = byCountry[country];
        data.count += 1;

        const officeEntry = data.offices.find((o) => o.office === office);
        if (officeEntry) {
          officeEntry.count += 1;
        } else {
          data.offices.push({ office, count: 1 });
        }

        const kind = kindByCategory[change.category];
        if (kind) data.kindCounts[kind] += 1;

        if (change.riskLevel) {
          data.riskCounts[change.riskLevel] =
            (data.riskCounts[change.riskLevel] || 0) + 1;
        }

        data.recent.push(change);
      });

    Object.values(byCountry).forEach((data) => {
      data.offices.sort((a, b) => b.count - a.count);
      data.recent.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      );
      data.recent = data.recent.slice(0, 5);
    });

    const countries = Object.values(byCountry).sort(
      (a, b) => b.count - a.count,
    );
    const totalCount = countries.reduce((sum, c) => sum + c.count, 0);

    return { countries, totalCount };
  }, [changes, categories, users]);
};
