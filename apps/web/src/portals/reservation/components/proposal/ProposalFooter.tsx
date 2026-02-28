"use client";

import React from "react";

interface OrgSettings {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  opening_hours?: Array<{
    day: string;
    open: string;
    close: string;
  }>;
}

interface ProposalFooterProps {
  venueName: string;
  venueLogoUrl: string | null;
  address?: string;
  orgSettings: OrgSettings;
}

function SocialIcon({ type }: { type: "instagram" | "facebook" | "tiktok" }) {
  const paths: Record<string, React.ReactNode> = {
    instagram: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    ),
    facebook: (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    ),
    tiktok: (
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    ),
  };

  return (
    <svg
      className="h-5 w-5 fill-current"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths[type]}
    </svg>
  );
}

export default function ProposalFooter({
  venueName,
  venueLogoUrl,
  address,
  orgSettings,
}: ProposalFooterProps) {
  const { phone, email, website, instagram, facebook, tiktok, opening_hours } =
    orgSettings;

  const hasSocials = instagram || facebook || tiktok;
  const hasContact = phone || email || website;
  const hasHours = opening_hours && opening_hours.length > 0;

  return (
    <footer className="bg-vf-navy text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Col 1: Logo + name + address */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {venueLogoUrl && (
                <img
                  src={venueLogoUrl}
                  alt={`${venueName} logo`}
                  className="h-12 w-12 rounded-full object-cover border border-white/20"
                />
              )}
              <span className="text-lg font-semibold">{venueName}</span>
            </div>
            {address && (
              <p className="text-sm text-white/60 leading-relaxed">
                {address}
              </p>
            )}
          </div>

          {/* Col 2: Opening hours */}
          {hasHours && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                Opening Hours
              </h4>
              <ul className="space-y-1">
                {opening_hours!.map((h) => (
                  <li
                    key={h.day}
                    className="flex justify-between text-sm text-white/70"
                  >
                    <span>{h.day}</span>
                    <span>
                      {h.open} – {h.close}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Col 3: Contact + Socials */}
          <div className="space-y-4">
            {hasContact && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                  Contact
                </h4>
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="block text-sm text-white/70 hover:text-vf-gold transition-colors"
                  >
                    {phone}
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="block text-sm text-white/70 hover:text-vf-gold transition-colors"
                  >
                    {email}
                  </a>
                )}
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-white/70 hover:text-vf-gold transition-colors"
                  >
                    {website}
                  </a>
                )}
              </div>
            )}

            {hasSocials && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                  Follow Us
                </h4>
                <div className="flex gap-3">
                  {instagram && (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-vf-gold transition-colors"
                      aria-label="Instagram"
                    >
                      <SocialIcon type="instagram" />
                    </a>
                  )}
                  {facebook && (
                    <a
                      href={facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-vf-gold transition-colors"
                      aria-label="Facebook"
                    >
                      <SocialIcon type="facebook" />
                    </a>
                  )}
                  {tiktok && (
                    <a
                      href={tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-vf-gold transition-colors"
                      aria-label="TikTok"
                    >
                      <SocialIcon type="tiktok" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4 sm:px-10">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} {venueName}. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Powered by{" "}
            <span className="text-vf-gold/60 font-medium">VenueFlow</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
