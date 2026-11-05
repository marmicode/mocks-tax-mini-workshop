import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {
  COACHING_URL,
  CONTACT_URL,
  COURSE_URL,
  TEAM_WORKSHOPS_URL,
  WORKSHOP_URL,
  withUtm,
} from './site-links';

const config: Config = {
  title: 'Mocks Tax Mini Workshop by Marmicode',
  tagline: 'Workshop instructions',

  future: {
    v4: true,
  },

  url: 'https://mocks-tax.marmicode.io',
  baseUrl: '/',

  organizationName: 'marmicode',
  projectName: 'mocks-tax-mini-workshop',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'instructions',
          routeBasePath: '',
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        blog: false,
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    announcementBar: {
      id: 'ngpoland-webinar-workshop',
      content: `Want the full day? Join <a href="${withUtm(WORKSHOP_URL, 'banner')}" target="_blank" rel="noopener">"From Drift to Trust" on 16 Nov, Warsaw or online →</a>`,
      isCloseable: true,
    },
    navbar: {
      title: 'Marmicode',
      logo: {
        alt: 'Marmicode',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'instructions',
          position: 'left',
          label: 'Instructions',
        },
        {
          label: '🎓 Full-Day Workshop',
          href: withUtm(WORKSHOP_URL, 'navbar'),
          position: 'right',
        },
        {
          label: '📺 Video Course',
          href: withUtm(COURSE_URL, 'navbar'),
          position: 'right',
        },
      ],
    },

    footer: {
      links: [
        {
          title: 'Next steps',
          items: [
            {
              label: '🎓 Full-Day Workshop',
              href: withUtm(WORKSHOP_URL, 'footer'),
            },
            {
              label: '📺 Video Course',
              href: withUtm(COURSE_URL, 'footer'),
            },
            {
              label: '💌 Newsletter',
              href: withUtm(
                'https://marmicode.us3.list-manage.com/subscribe?u=915d6ba70c9c00912ba326214&id=71255f30c7',
                'footer',
              ),
            },
          ],
        },
        {
          title: 'Need help?',
          items: [
            {
              label: '👨🏻‍🏫 Workshops for Teams',
              href: withUtm(TEAM_WORKSHOPS_URL, 'footer'),
            },
            {
              label: '🚀 Team Coaching',
              href: withUtm(COACHING_URL, 'footer'),
            },
            {
              label: '✉️ Contact',
              href: withUtm(CONTACT_URL, 'footer'),
            },
          ],
        },
        {
          title: 'Stay tuned',
          items: [
            {
              label: '📺 Youtube',
              href: 'https://www.youtube.com/marmicode',
            },
            {
              label: '🦋 Bluesky',
              href: 'https://bsky.app/profile/younes.marmico.de',
            },
            {
              label: 'X',
              href: 'https://x.com/yjaaidi',
            },
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/in/yjaaidi/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Marmicode.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
