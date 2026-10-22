import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import Metadata from '@theme-original/DocItem/Metadata';
import type MetadataType from '@theme/DocItem/Metadata';
import type {WrapperProps} from '@docusaurus/types';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type Props = WrapperProps<typeof MetadataType>;

// Adds TechArticle structured data to every doc page, next to the BreadcrumbList
// the theme already emits, so search engines and answer engines know what a page is.
export default function MetadataWrapper(props: Props): ReactNode {
  const {metadata, frontMatter} = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const url = `${siteConfig.url}${metadata.permalink}`;
  const keywords = (frontMatter.keywords ?? []).join(', ');

  const article = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: metadata.title,
    description: metadata.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    ...(keywords ? {keywords} : {}),
    ...(metadata.lastUpdatedAt ? {dateModified: new Date(metadata.lastUpdatedAt).toISOString()} : {}),
    image: `${siteConfig.url}/img/social-card.png`,
    author: {'@type': 'Organization', name: 'Cloider', url: 'https://cloider.com'},
    publisher: {'@id': 'https://cloider.com/#organization'},
    isPartOf: {'@id': `${siteConfig.url}/#website`},
    about: {'@type': 'SoftwareApplication', name: 'Cloider', applicationCategory: 'DeveloperApplication', operatingSystem: 'Web, Linux, macOS, Windows'},
  };

  return (
    <>
      <Metadata {...props} />
      <Head>
        <link rel="alternate" type="text/markdown" href={`${url}.md`} />
        <script type="application/ld+json">{JSON.stringify(article)}</script>
      </Head>
    </>
  );
}
