import { promises as fs } from 'fs';
import path from 'path';
import {
  NavbarConfig,
  NavbarItem,
  NavbarSection,
  getDefaultNavbarConfig,
} from './navbarConfig';

const NAVBAR_CONFIG_FILE = path.join(process.cwd(), 'data', 'navbar-config.json');

const mergeSection = (
  base: NavbarSection,
  partial?: Partial<NavbarSection>
): NavbarSection => ({
  ...base,
  ...partial,
  items: Array.isArray(partial?.items) ? (partial?.items as NavbarItem[]) : base.items,
});

const mergePrimaryLinks = (base: NavbarItem[], next?: NavbarItem[]): NavbarItem[] =>
  Array.isArray(next) ? next : base;

export const normalizeNavbarConfig = (
  config?: Partial<NavbarConfig> | null,
  baseConfig?: NavbarConfig
): NavbarConfig => {
  const base = baseConfig ?? getDefaultNavbarConfig();

  if (!config || typeof config !== 'object') {
    return base;
  }

  const sections = (config.sections ?? {}) as Partial<NavbarConfig['sections']>;
  const articles = sections?.articles as
    | (Partial<NavbarSection> & { useAutoCategories?: boolean; autoCount?: number })
    | undefined;

  return {
    ...base,
    ...config,
    brand: { ...base.brand, ...(config.brand ?? {}) },
    primaryLinks: mergePrimaryLinks(base.primaryLinks, config.primaryLinks),
    sections: {
      directories: mergeSection(base.sections.directories, sections?.directories),
      tools: mergeSection(base.sections.tools, sections?.tools),
      articles: {
        ...mergeSection(base.sections.articles, sections?.articles),
        useAutoCategories:
          typeof articles?.useAutoCategories === 'boolean'
            ? articles.useAutoCategories
            : base.sections.articles.useAutoCategories,
        autoCount:
          typeof articles?.autoCount === 'number'
            ? articles.autoCount
            : base.sections.articles.autoCount,
      },
    },
    actions: { ...base.actions, ...(config.actions ?? {}) },
    contactLink: { ...base.contactLink, ...(config.contactLink ?? {}) },
  };
};

export async function readNavbarConfig(): Promise<NavbarConfig> {
  try {
    const data = await fs.readFile(NAVBAR_CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Partial<NavbarConfig>;
    return normalizeNavbarConfig(parsed);
  } catch {
    return getDefaultNavbarConfig();
  }
}

export async function writeNavbarConfig(config: NavbarConfig): Promise<void> {
  const dir = path.dirname(NAVBAR_CONFIG_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(NAVBAR_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function resetNavbarConfig(): Promise<NavbarConfig> {
  const base = getDefaultNavbarConfig();
  await writeNavbarConfig(base);
  return base;
}
