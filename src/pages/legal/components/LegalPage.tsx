import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import JsonLd from '@/components/feature/JsonLd';
import { initPanels } from '@/pages/home/lib/panels';
import { breadcrumbSchema } from '@/lib/seo';

export interface LegalSection {
  id: string;
  title: string;
  body: string;
  points?: string[];
}

interface RelatedLink {
  label: string;
  to: string;
}

const DOC_PATH: Record<string, string> = {
  terms: '/terms',
  privacy: '/privacy',
  returns: '/returns',
};

interface LegalPageProps {
  doc: 'terms' | 'privacy' | 'returns';
}

/* Shared shell for the three legal documents: hero, sticky contents rail,
   numbered sections and cross-links to the sibling documents. The active
   section in the rail follows the reader as they scroll. */
export default function LegalPage({ doc }: LegalPageProps) {
  const { t } = useTranslation();

  const sections = useMemo(() => {
    const value = t(`legal.${doc}.sections`, { returnObjects: true });
    return Array.isArray(value) ? (value as unknown as LegalSection[]) : [];
  }, [doc, t]);

  const related = useMemo(() => {
    const value = t('legal.relatedLinks', { returnObjects: true });
    return Array.isArray(value) ? (value as unknown as RelatedLink[]) : [];
  }, [t]);

  const [active, setActive] = useState('');

  const title = t(`legal.${doc}.crumb`);

  useEffect(() => initPanels(), []);

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — Safeer`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  useEffect(() => {
    if (!sections.length) return;
    setActive(sections[0].id);

    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -62% 0px', threshold: 0 },
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const currentPath = DOC_PATH[doc] ?? '';

  const crumbSchema = useMemo(() => breadcrumbSchema([
    { name: t('legal.crumbHome'), path: '/' },
    { name: title, path: currentPath },
  ]), [t, title, currentPath]);

  return (
    <div className="st-shell">
      <JsonLd id="sia-legal-breadcrumb" data={crumbSchema} />
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={title}>
              <Link to="/">{t('legal.crumbHome')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{title}</span>
            </nav>

            <h1>
              {t(`legal.${doc}.titleLead`)}{' '}
              <em className="accent">{t(`legal.${doc}.titleAccent`)}</em>
            </h1>
            <p className="lead">{t(`legal.${doc}.sub`)}</p>

            <div className="st-legal-badges">
              <span className="st-legal-badge">
                <i className="ri-calendar-check-line" />
                {t('legal.updatedLabel')}: {t('legal.updated')}
              </span>
              <span className="st-legal-badge">
                <i className="ri-draft-line" />
                {t('legal.toc')} · {sections.length}
              </span>
            </div>
          </div>
        </header>

        <div className="st-wrap">
          <div className="st-legal-grid">
            <aside className="st-legal-toc">
              <h2>
                <i className="ri-list-check-2" />
                {t('legal.toc')}
              </h2>
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={active === section.id ? 'is-on' : ''}
                      onClick={() => setActive(section.id)}
                    >
                      <span className="n">{String(index + 1).padStart(2, '0')}</span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
              <Link className="toc-cta" to="/support">
                <i className="ri-customer-service-2-line" />
                <span>{t('legal.help.cta')}</span>
                <i className="ri-arrow-left-line" />
              </Link>
            </aside>

            <article className="st-legal-doc">
              <p className="st-legal-intro">{t(`legal.${doc}.intro`)}</p>

              {sections.map((section, index) => (
                <section className="st-legal-sec" id={section.id} key={section.id}>
                  <h2>
                    <span className="num">{String(index + 1).padStart(2, '0')}</span>
                    <span>{section.title}</span>
                  </h2>
                  <p>{section.body}</p>
                  {section.points && section.points.length > 0 && (
                    <ul>
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <div className="st-legal-foot">
                {related.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={link.to === currentPath ? 'is-here' : ''}
                  >
                    <i className={link.to === currentPath ? 'ri-file-text-line' : 'ri-arrow-left-up-line'} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <div className="st-legal-help">
            <span className="ic" aria-hidden="true">
              <i className="ri-question-answer-line" />
            </span>
            <div className="body">
              <h3>{t('legal.help.title')}</h3>
              <p>{t('legal.help.text')}</p>
            </div>
            <Link className="st-btn primary" to="/support">
              <i className="ri-customer-service-2-line" />
              {t('legal.help.cta')}
            </Link>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}