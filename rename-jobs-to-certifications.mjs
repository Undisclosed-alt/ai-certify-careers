// rename-jobs-to-certifications.mjs
import { promises as fs } from 'fs';
import globby from 'globby';
import path from 'path';

const patterns = [
  'src/**/*.{ts,tsx,js,jsx}',
  'public/**/*.html',
  '*.json'
];

const swaps = [
  // user-facing text  (Keep order: plural → singular to avoid double-replacing)
  { re: /\bJob Roles\b/g, to: 'Certifications' },
  { re: /\bJob Role\b/g,  to: 'Certification'  },
  { re: /\bjob roles\b/g, to: 'certifications' },
  { re: /\bjob role\b/g,  to: 'certification'  },
  { re: /\bJobs\b/g,      to: 'Certifications' },
  { re: /\bJob\b/g,       to: 'Certification'  },

  // URLs & API paths
  { re: /\/jobs\b/g,            to: '/certifications' },

  // identifiers (code)
  { re: /\bJobRolesTab\b/g,         to: 'CertificationsTab' },
  { re: /\bJobRoleCard\b/g,         to: 'CertificationCard' },
  { re: /\bJobListPage\b/g,         to: 'CertificationListPage' },
  { re: /\bJobDetailPage\b/g,       to: 'CertificationDetailPage' },
  { re: /\bJobRole\b/g,             to: 'Certification' },
  { re: /\bgetJobRoles\b/g,         to: 'getCertifications' },
  { re: /\buseBuyExam\b/g,          to: 'useBuyCertification' },
  { re: /\bjobRoleId\b/g,           to: 'certificationId' }
];

const files = await globby(patterns, { gitignore: true });

for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  let changed = text;
  for (const { re, to } of swaps) changed = changed.replace(re, to);
  if (changed !== text) {
    await fs.writeFile(file, changed);
    console.log(`updated ${file}`);
  }
}

/* --------  file moves  -------- */
const renames = [
  ['src/pages/JobListPage.tsx',       'src/pages/CertificationListPage.tsx'],
  ['src/pages/JobDetailPage.tsx',     'src/pages/CertificationDetailPage.tsx'],
  ['src/components/JobRoleCard.tsx',  'src/components/CertificationCard.tsx'],
  ['src/components/admin/JobRolesTab.tsx','src/components/admin/CertificationsTab.tsx']
];

for (const [from, to] of renames) {
  try {
    await fs.rename(from, to);
    console.log(`renamed ${from}  →  ${to}`);
  } catch { /* file may already be gone – ignore */ }
}
