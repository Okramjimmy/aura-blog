import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

const EFFECTIVE_DATE = 'March 20, 2026';
const SITE_NAME = 'Aura';
const SITE_URL = 'https://aura.okram.co.in';
const OWNER_NAME = 'Okram Jimmy Singh';
const OWNER_EMAIL = 'okramjimmy@gmail.com';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-2xl font-serif text-ink mb-4 pb-3 border-b border-subtle">{title}</h2>
      <div className="space-y-4 text-ink/75 font-light leading-relaxed">{children}</div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="text-accent mt-1.5 flex-shrink-0 text-xs">▸</span>
      <span>{children}</span>
    </li>
  );
}

const TOC = [
  { id: 'agreement', label: 'Agreement to Terms' },
  { id: 'use', label: 'Acceptable Use' },
  { id: 'content', label: 'Content & Intellectual Property' },
  { id: 'user-content', label: 'User-Submitted Content' },
  { id: 'advertising', label: 'Advertising' },
  { id: 'subscriptions', label: 'Newsletter Subscriptions' },
  { id: 'links', label: 'Third-Party Links' },
  { id: 'disclaimer', label: 'Disclaimer of Warranties' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsOfService() {
  return (
    <div className="px-4 md:px-8 lg:px-12 py-12 md:py-20 max-w-7xl mx-auto">
      <Seo title="Terms of Service" description="Terms of Service for Aura — your rights and responsibilities when using this site." canonical="/terms" noindex />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

        {/* Sidebar TOC */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28">
            <p className="text-xs uppercase tracking-widest text-ink/40 font-medium mb-4">On this page</p>
            <nav className="space-y-1">
              {TOC.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-ink/60 hover:text-accent transition-colors py-1.5 pl-3 border-l border-subtle hover:border-accent"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-subtle">
              <p className="text-xs text-ink/40 leading-relaxed">
                Effective: {EFFECTIVE_DATE}
              </p>
              <Link to="/privacy" className="block text-xs text-accent hover:underline mt-3">
                Privacy Policy →
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-9">
          {/* Header */}
          <div className="mb-12">
            <p className="text-sm uppercase tracking-widest text-accent font-medium mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-serif text-ink mb-4">Terms of Service</h1>
            <p className="text-ink/60 font-light leading-relaxed max-w-2xl">
              These Terms of Service govern your use of{' '}
              <span className="text-ink">{SITE_URL}</span> and all content, services, and features
              provided by {OWNER_NAME} ("{SITE_NAME}", "we", "us", or "our").
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs text-ink/40 bg-subtle/50 rounded-full px-4 py-2">
              <span>Effective date:</span>
              <span className="font-medium text-ink/60">{EFFECTIVE_DATE}</span>
            </div>
          </div>

          <Section id="agreement" title="Agreement to Terms">
            <p>
              By accessing or using {SITE_NAME} at <span className="text-ink">{SITE_URL}</span>,
              you agree to be bound by these Terms of Service and our{' '}
              <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
              If you do not agree to these terms, please do not use this site.
            </p>
            <p>
              These terms apply to all visitors, readers, newsletter subscribers, and anyone who
              submits a contact form message or otherwise interacts with this site.
            </p>
          </Section>

          <Section id="use" title="Acceptable Use">
            <p>
              You may use this site for lawful, personal, non-commercial purposes. By using this
              site, you agree not to:
            </p>
            <ul className="space-y-2">
              <Li>
                Reproduce, redistribute, or republish any content from this site without explicit
                written permission from {OWNER_NAME}.
              </Li>
              <Li>
                Use automated tools (bots, scrapers, spiders) to access, crawl, or extract content
                from this site at a rate or scale that disrupts normal operation.
              </Li>
              <Li>
                Attempt to gain unauthorized access to any part of the site, its server, or any
                database connected to it.
              </Li>
              <Li>
                Submit false, misleading, or fraudulent information through the contact form or
                subscription form.
              </Li>
              <Li>
                Use this site to transmit spam, malware, or any harmful or malicious content.
              </Li>
              <Li>
                Impersonate {OWNER_NAME} or any other person or entity, or falsely represent an
                affiliation with any organization.
              </Li>
              <Li>
                Engage in any activity that violates applicable local, national, or international laws
                or regulations.
              </Li>
              <Li>
                Circumvent or disable any security measures, access controls, or content restrictions
                implemented on this site.
              </Li>
            </ul>
            <p>
              We reserve the right to block or restrict access to any user or IP address that
              violates these acceptable use conditions.
            </p>
          </Section>

          <Section id="content" title="Content &amp; Intellectual Property">
            <p>
              All content published on {SITE_NAME} — including but not limited to blog posts,
              essays, project descriptions, source code samples, design, layout, and graphics — is
              the intellectual property of {OWNER_NAME}, unless otherwise attributed.
            </p>

            <div>
              <h3 className="text-base font-medium text-ink mb-2">What you may do</h3>
              <ul className="space-y-2">
                <Li>
                  Read, link to, and share individual articles or pages for personal, non-commercial
                  purposes, provided you attribute the source and link back to the original URL.
                </Li>
                <Li>
                  Quote short excerpts (up to 150 words) from articles for commentary, criticism,
                  or educational purposes, with attribution.
                </Li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-medium text-ink mb-2">What you may not do</h3>
              <ul className="space-y-2">
                <Li>
                  Copy full articles, essays, or substantial portions of content and republish them
                  on another website, publication, or platform — with or without attribution — without
                  prior written permission.
                </Li>
                <Li>
                  Use any content from this site for commercial purposes, AI training datasets,
                  or automated content generation without explicit written consent.
                </Li>
                <Li>
                  Remove or alter any copyright notices, authorship credits, or attribution
                  embedded in the content.
                </Li>
              </ul>
            </div>

            <p>
              To request permission to use content beyond these terms, please contact{' '}
              <a href={`mailto:${OWNER_EMAIL}`} className="text-accent hover:underline">
                {OWNER_EMAIL}
              </a>.
            </p>

            <div>
              <h3 className="text-base font-medium text-ink mb-2">Open source code</h3>
              <p>
                Code snippets published in blog posts are shared for educational purposes and may be
                used freely in personal or commercial projects unless otherwise noted. The source code
                of this website itself, if publicly available on GitHub, is governed by its own
                repository license.
              </p>
            </div>
          </Section>

          <Section id="user-content" title="User-Submitted Content">
            <p>
              When you submit content through the contact form or any other input on this site
              (messages, inquiries, feedback), you grant {OWNER_NAME} a non-exclusive, royalty-free
              license to use, store, and reference that content for the purpose of responding to
              your inquiry.
            </p>
            <p>
              You represent and warrant that any content you submit:
            </p>
            <ul className="space-y-2">
              <Li>Does not infringe on the intellectual property rights of any third party.</Li>
              <Li>Is not defamatory, abusive, harassing, threatening, or otherwise unlawful.</Li>
              <Li>Does not contain personal data about third parties shared without their consent.</Li>
            </ul>
            <p>
              We reserve the right to delete or decline to respond to any submitted content that
              violates these terms.
            </p>
          </Section>

          <Section id="advertising" title="Advertising">
            <p>
              This site displays third-party advertisements through <strong className="text-ink">Google AdSense</strong>.
              These advertisements are served automatically based on content relevance and, where
              consent applies, user interest data collected via cookies.
            </p>
            <p>
              We are not responsible for the content, accuracy, products, or services advertised
              through Google AdSense. Advertisements are clearly distinguishable from editorial content.
              We do not endorse any product or service appearing in an advertisement on this site.
            </p>
            <p>
              Click on ads at your own discretion. Interactions with advertised products or services
              are solely between you and the respective advertiser. We are not a party to any
              transactions resulting from advertising on this site.
            </p>
            <p>
              For details on how Google uses cookies in connection with advertising on this site,
              see our{' '}
              <Link to="/privacy#advertising" className="text-accent hover:underline">
                Privacy Policy — Advertising section
              </Link>.
            </p>
          </Section>

          <Section id="subscriptions" title="Newsletter Subscriptions">
            <p>
              By subscribing to the {SITE_NAME} newsletter, you consent to receive periodic emails
              from {OWNER_NAME} containing essays, updates, and site announcements.
            </p>
            <ul className="space-y-2">
              <Li>
                You may unsubscribe at any time by clicking the unsubscribe link at the bottom of
                any newsletter email, or by emailing{' '}
                <a href={`mailto:${OWNER_EMAIL}`} className="text-accent hover:underline">
                  {OWNER_EMAIL}
                </a>{' '}
                with "unsubscribe" in the subject line.
              </Li>
              <Li>
                We will not use your email address to send unsolicited commercial email or share it
                with third parties for their marketing purposes.
              </Li>
              <Li>
                Unsubscribe requests are processed within 5 business days.
              </Li>
            </ul>
          </Section>

          <Section id="links" title="Third-Party Links">
            <p>
              This site may contain links to external websites, tools, or resources operated by
              third parties. These links are provided for convenience and informational purposes only.
            </p>
            <p>
              We have no control over, and assume no responsibility for, the content, privacy
              policies, or practices of any third-party website. The inclusion of a link does not
              imply endorsement by {SITE_NAME} or {OWNER_NAME}.
            </p>
            <p>
              We encourage you to review the terms and privacy policies of any third-party site you
              visit through a link on this site.
            </p>
          </Section>

          <Section id="disclaimer" title="Disclaimer of Warranties">
            <p>
              This site and all of its content are provided <strong className="text-ink">"as is"</strong>{' '}
              and <strong className="text-ink">"as available"</strong>, without any warranties of any
              kind — express, implied, statutory, or otherwise — including but not limited to implied
              warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <ul className="space-y-2">
              <Li>
                We do not warrant that the site will be available, uninterrupted, error-free, or
                free from viruses or other harmful components.
              </Li>
              <Li>
                We do not warrant the accuracy, completeness, reliability, or timeliness of any
                content published on this site. Blog posts and essays reflect the author's personal
                opinions and should not be relied upon as professional advice (legal, financial,
                medical, or otherwise).
              </Li>
              <Li>
                Technical content and code samples are provided for educational purposes. We make no
                guarantees about the suitability of code examples for use in production environments.
              </Li>
            </ul>
          </Section>

          <Section id="liability" title="Limitation of Liability">
            <p>
              To the fullest extent permitted by applicable law, {OWNER_NAME} shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising out
              of or relating to your use of — or inability to use — this site or its content,
              including but not limited to:
            </p>
            <ul className="space-y-2">
              <Li>Loss of data, revenue, or profits.</Li>
              <Li>
                Damages resulting from reliance on any information or advice published on this site.
              </Li>
              <Li>
                Damages resulting from unauthorized access to or alteration of your transmissions
                or data.
              </Li>
              <Li>
                Damages caused by third-party content, advertisements, or linked websites.
              </Li>
            </ul>
            <p>
              In jurisdictions that do not allow the exclusion of certain warranties or the limitation
              of liability for certain types of damages, our liability shall be limited to the maximum
              extent permitted by law.
            </p>
          </Section>

          <Section id="indemnification" title="Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless {OWNER_NAME}, his affiliates,
              and any service providers from and against any claims, liabilities, damages, judgments,
              awards, losses, costs, or expenses (including reasonable legal fees) arising out of or
              relating to:
            </p>
            <ul className="space-y-2">
              <Li>Your violation of these Terms of Service.</Li>
              <Li>Your violation of any applicable law or regulation.</Li>
              <Li>Any content you submit to this site that harms a third party.</Li>
            </ul>
          </Section>

          <Section id="termination" title="Termination">
            <p>
              We reserve the right to restrict, suspend, or terminate your access to this site at
              any time, without prior notice, for any conduct that we believe violates these Terms of
              Service, is harmful to other users, or is otherwise objectionable.
            </p>
            <p>
              You may stop using this site at any time. To delete your subscriber data or contact form
              submissions, see the Your Rights section of the{' '}
              <Link to="/privacy#your-rights" className="text-accent hover:underline">Privacy Policy</Link>.
            </p>
          </Section>

          <Section id="governing-law" title="Governing Law">
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws
              of India, without regard to its conflict of law provisions. Any disputes arising under
              these terms shall be subject to the exclusive jurisdiction of the courts located in
              Manipur, India.
            </p>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision
              shall be limited or eliminated to the minimum extent necessary so that these Terms
              otherwise remain in full force and effect.
            </p>
          </Section>

          <Section id="changes" title="Changes to These Terms">
            <p>
              We reserve the right to update these Terms of Service at any time. When we do, we will
              revise the "effective date" at the top of this page. For significant changes, we may
              also notify newsletter subscribers.
            </p>
            <p>
              Your continued use of the site after changes are posted constitutes your acceptance
              of the revised terms. We encourage you to review this page periodically.
            </p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              If you have any questions about these Terms of Service, please contact:
            </p>
            <div className="bg-subtle/40 rounded-2xl p-6 mt-4 border border-subtle">
              <p className="font-medium text-ink mb-1">{OWNER_NAME}</p>
              <p className="text-sm text-ink/60 mb-1">Singjamei, Imphal West, Manipur, India</p>
              <a href={`mailto:${OWNER_EMAIL}`} className="text-accent hover:underline text-sm">
                {OWNER_EMAIL}
              </a>
            </div>
            <p className="text-sm mt-4">
              You can also reach us via the{' '}
              <Link to="/contact" className="text-accent hover:underline">contact page</Link>.
            </p>
          </Section>

          {/* Footer nav */}
          <div className="border-t border-subtle pt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <p className="text-xs text-ink/40">
              © {new Date().getFullYear()} {SITE_NAME} · {OWNER_NAME}
            </p>
            <div className="flex gap-6 text-xs text-ink/50">
              <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-accent transition-colors">Contact</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
