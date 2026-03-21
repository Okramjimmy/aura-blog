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

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-medium text-ink mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
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
  { id: 'overview', label: 'Overview' },
  { id: 'data-collected', label: 'Information We Collect' },
  { id: 'data-use', label: 'How We Use Your Information' },
  { id: 'cookies', label: 'Cookies & Tracking' },
  { id: 'advertising', label: 'Advertising (Google AdSense)' },
  { id: 'third-parties', label: 'Third-Party Services' },
  { id: 'data-retention', label: 'Data Retention & Storage' },
  { id: 'your-rights', label: 'Your Rights & Choices' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact' },
];

export default function PrivacyPolicy() {
  return (
    <div className="px-4 md:px-8 lg:px-12 py-12 md:py-20 max-w-7xl mx-auto">
      <Seo title="Privacy Policy" description="Privacy Policy for Aura — how we collect, use, and protect your data." canonical="/privacy" noindex />
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
              <Link to="/terms" className="block text-xs text-accent hover:underline mt-3">
                Terms of Service →
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-9">
          {/* Header */}
          <div className="mb-12">
            <p className="text-sm uppercase tracking-widest text-accent font-medium mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-serif text-ink mb-4">Privacy Policy</h1>
            <p className="text-ink/60 font-light leading-relaxed max-w-2xl">
              This Privacy Policy explains how {OWNER_NAME} ("{SITE_NAME}", "we", "us", or "our") collects,
              uses, and protects your personal information when you visit{' '}
              <span className="text-ink">{SITE_URL}</span>.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs text-ink/40 bg-subtle/50 rounded-full px-4 py-2">
              <span>Effective date:</span>
              <span className="font-medium text-ink/60">{EFFECTIVE_DATE}</span>
            </div>
          </div>

          {/* Sections */}
          <Section id="overview" title="Overview">
            <p>
              {SITE_NAME} is a personal blog and portfolio website where Okram Jimmy Singh publishes
              essays on software engineering, design, and technology. The site also hosts a public
              projects portfolio, a contact form, and a newsletter subscription service.
            </p>
            <p>
              We respect your privacy. We collect only what we need to operate the site, improve your
              experience, and — where you've consented — serve relevant advertising through Google
              AdSense. We do not sell your personal information to third parties.
            </p>
          </Section>

          <Section id="data-collected" title="Information We Collect">
            <Sub title="Information you provide directly">
              <ul className="space-y-2">
                <Li>
                  <strong className="text-ink">Newsletter subscriptions:</strong> your email address,
                  submitted voluntarily via the subscription form on this site.
                </Li>
                <Li>
                  <strong className="text-ink">Contact form submissions:</strong> your name, email
                  address, and any message content you choose to send.
                </Li>
              </ul>
            </Sub>

            <Sub title="Information collected automatically">
              <p className="text-sm mb-2">
                When you visit this site, our server and third-party services may automatically collect:
              </p>
              <ul className="space-y-2">
                <Li>
                  <strong className="text-ink">IP address</strong> — used to estimate general
                  geographic location (country/region level) and detect abuse.
                </Li>
                <Li>
                  <strong className="text-ink">Browser and device information</strong> — browser type
                  and version, operating system, screen resolution, and device type.
                </Li>
                <Li>
                  <strong className="text-ink">Usage data</strong> — pages visited, referring URLs,
                  time spent on pages, links clicked, and navigation paths.
                </Li>
                <Li>
                  <strong className="text-ink">Cookies and similar tracking technologies</strong> —
                  see the Cookies section below for full details.
                </Li>
              </ul>
            </Sub>

            <Sub title="Information we do NOT collect">
              <p>
                We do not collect payment information, government identification, sensitive personal
                data (health, race, religion), or precise geolocation. We do not require account
                registration to read any content on this site.
              </p>
            </Sub>
          </Section>

          <Section id="data-use" title="How We Use Your Information">
            <p>We use the information collected for the following purposes:</p>
            <ul className="space-y-2">
              <Li>
                <strong className="text-ink">Newsletter delivery:</strong> to send you bi-weekly
                essays and updates that you explicitly subscribed to. Each email includes an
                unsubscribe link.
              </Li>
              <Li>
                <strong className="text-ink">Responding to contact messages:</strong> to reply to
                inquiries or feedback you send through the contact form.
              </Li>
              <Li>
                <strong className="text-ink">Site operation and security:</strong> to maintain uptime,
                debug errors, prevent abuse, and protect against unauthorized access.
              </Li>
              <Li>
                <strong className="text-ink">Analytics and improvement:</strong> to understand which
                content is popular, how visitors navigate the site, and where to focus development effort.
              </Li>
              <Li>
                <strong className="text-ink">Advertising:</strong> to serve relevant ads through
                Google AdSense. This may involve Google using cookies and your browsing behavior to
                show personalized ads (see the Advertising section below).
              </Li>
            </ul>
            <p>
              We do not use your data for automated decision-making or profiling beyond the standard
              ad personalization features provided by Google AdSense, which you can opt out of at
              any time.
            </p>
          </Section>

          <Section id="cookies" title="Cookies &amp; Tracking">
            <p>
              Cookies are small text files stored on your device by your browser. We and our
              third-party partners use cookies for the purposes described below.
            </p>

            <Sub title="Essential cookies">
              <p>
                These cookies are necessary for the site to function and cannot be disabled. They
                include session management for the admin interface (not applicable to regular readers)
                and security tokens.
              </p>
            </Sub>

            <Sub title="Analytics cookies">
              <p>
                We may use analytics tools to understand site traffic and content performance. These
                cookies collect anonymized data such as page views, session duration, and navigation
                flow. No personally identifiable information is stored in these cookies.
              </p>
            </Sub>

            <Sub title="Advertising cookies (Google AdSense)">
              <p className="mb-2">
                This site uses Google AdSense to display advertisements. Google AdSense uses the{' '}
                <strong className="text-ink">DoubleClick cookie</strong> (now part of Google Ads) to
                serve ads based on your prior visits to this site and other sites on the internet.
              </p>
              <p>
                These cookies allow Google and its partners to serve ads tailored to your interests.
                The DoubleClick cookie stores information about how you interact with ads — such as
                which ads you've seen, clicked, or dismissed — and uses this data to improve ad
                relevance across Google's advertising network.
              </p>
            </Sub>

            <Sub title="Preference cookies">
              <p>
                We store your UI preferences (such as light/dark mode and blog view preference)
                in your browser's <code className="text-xs bg-subtle px-1.5 py-0.5 rounded font-mono">localStorage</code>.
                This data stays on your device and is never transmitted to our server.
              </p>
            </Sub>

            <Sub title="Managing cookies">
              <p>
                You can control cookies through your browser settings. Most browsers allow you to
                block or delete cookies entirely, or selectively. Note that disabling cookies may
                affect some site functionality. You can also opt out of Google's use of cookies for
                ad personalization at{' '}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Google Ads Settings
                </a>{' '}
                or via the{' '}
                <a
                  href="https://optout.networkadvertising.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  NAI opt-out page
                </a>.
              </p>
            </Sub>
          </Section>

          <Section id="advertising" title="Advertising (Google AdSense)">
            <p>
              This site participates in Google AdSense, a program operated by Google LLC,
              1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. AdSense enables us to
              earn revenue from ads displayed alongside our content.
            </p>

            <Sub title="How Google AdSense works">
              <ul className="space-y-2">
                <Li>
                  Google uses cookies (including the DoubleClick cookie) and your browsing history
                  to determine which ads to show you.
                </Li>
                <Li>
                  Ads may be <strong className="text-ink">personalized</strong> based on your
                  interests and prior web activity, or <strong className="text-ink">non-personalized</strong>{' '}
                  if you have opted out of ad personalization.
                </Li>
                <Li>
                  Third-party vendors, including Google, use first-party cookies (such as the Google
                  Analytics cookie) and third-party cookies (such as the DoubleClick cookie) together
                  to inform, optimize, and serve ads.
                </Li>
                <Li>
                  Google may combine your data from AdSense with data from other Google services
                  (such as Google Search and YouTube) if you are signed into a Google account.
                </Li>
              </ul>
            </Sub>

            <Sub title="Opting out of personalized ads">
              <p>
                You can opt out of personalized advertising served by Google in any of the following
                ways:
              </p>
              <ul className="space-y-2 mt-2">
                <Li>
                  Visit{' '}
                  <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    adssettings.google.com
                  </a>{' '}
                  to manage your Google ad personalization preferences.
                </Li>
                <Li>
                  Visit{' '}
                  <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    aboutads.info/choices
                  </a>{' '}
                  to opt out of interest-based advertising from participating companies.
                </Li>
                <Li>
                  Install the{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    Google Analytics Opt-out Browser Add-on
                  </a>{' '}
                  to prevent your data from being used by Google Analytics.
                </Li>
                <Li>
                  Use your browser's private/incognito mode, which limits cookie-based tracking
                  within a session.
                </Li>
              </ul>
              <p className="mt-3">
                Opting out of personalized ads does not mean you will see no ads — you may still see
                non-personalized ads based on the content of the page you are viewing.
              </p>
            </Sub>

            <Sub title="Google's Privacy Policy">
              <p>
                Google's collection and use of data in connection with AdSense is governed by Google's
                Privacy Policy, available at{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  policies.google.com/privacy
                </a>.
              </p>
            </Sub>
          </Section>

          <Section id="third-parties" title="Third-Party Services">
            <p>
              In addition to Google AdSense, this site uses the following third-party services:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mt-2">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="text-left py-2 pr-6 font-medium text-ink">Service</th>
                    <th className="text-left py-2 pr-6 font-medium text-ink">Purpose</th>
                    <th className="text-left py-2 font-medium text-ink">Privacy Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle/50">
                  {[
                    {
                      service: 'Google AdSense',
                      purpose: 'Display advertising',
                      link: 'https://policies.google.com/privacy',
                      label: 'policies.google.com',
                    },
                    {
                      service: 'Google Fonts',
                      purpose: 'Typography (Cormorant Garamond, Inter)',
                      link: 'https://policies.google.com/privacy',
                      label: 'policies.google.com',
                    },
                    {
                      service: 'Picsum Photos',
                      purpose: 'Placeholder images for blog posts',
                      link: 'https://picsum.photos',
                      label: 'picsum.photos',
                    },
                    {
                      service: 'GitHub API',
                      purpose: 'Public repository data on the GitHub page',
                      link: 'https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement',
                      label: 'GitHub Privacy Statement',
                    },
                  ].map(row => (
                    <tr key={row.service}>
                      <td className="py-3 pr-6 text-ink">{row.service}</td>
                      <td className="py-3 pr-6 text-ink/60">{row.purpose}</td>
                      <td className="py-3">
                        <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs">
                          {row.label}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              These third parties operate under their own privacy policies and we are not responsible
              for their data practices. We encourage you to review their policies directly.
            </p>
          </Section>

          <Section id="data-retention" title="Data Retention &amp; Storage">
            <Sub title="Newsletter email addresses">
              <p>
                Email addresses collected for newsletter subscription are stored in our PostgreSQL
                database hosted on a private server. They are retained until you unsubscribe or
                request deletion. We do not share subscriber email addresses with any third party.
              </p>
            </Sub>
            <Sub title="Contact form submissions">
              <p>
                Messages submitted via the contact form are stored in our database and retained for
                up to 12 months to allow for follow-up correspondence. After that period, submissions
                are deleted unless there is a legitimate reason to retain them longer.
              </p>
            </Sub>
            <Sub title="Server logs">
              <p>
                Our server may retain access logs (including IP addresses and request timestamps) for
                up to 30 days for security monitoring and abuse prevention purposes.
              </p>
            </Sub>
            <Sub title="Security">
              <p>
                All data is stored on servers with restricted access. Communication between your
                browser and this site is encrypted via HTTPS/TLS. We take reasonable technical and
                organizational measures to protect your data against unauthorized access, loss, or
                disclosure. However, no method of transmission over the internet is 100% secure.
              </p>
            </Sub>
          </Section>

          <Section id="your-rights" title="Your Rights &amp; Choices">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="space-y-2">
              <Li>
                <strong className="text-ink">Access:</strong> request a copy of the personal
                information we hold about you.
              </Li>
              <Li>
                <strong className="text-ink">Correction:</strong> request that we correct inaccurate
                or incomplete data.
              </Li>
              <Li>
                <strong className="text-ink">Deletion:</strong> request that we delete your personal
                data. To remove your email from our newsletter list, use the unsubscribe link in any
                email we send, or contact us directly.
              </Li>
              <Li>
                <strong className="text-ink">Objection:</strong> object to the processing of your
                data for direct marketing purposes.
              </Li>
              <Li>
                <strong className="text-ink">Portability:</strong> request your data in a
                machine-readable format.
              </Li>
              <Li>
                <strong className="text-ink">Opt out of personalized ads:</strong> see the
                Advertising section above for opt-out options.
              </Li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <a href={`mailto:${OWNER_EMAIL}`} className="text-accent hover:underline">
                {OWNER_EMAIL}
              </a>. We will respond within 30 days.
            </p>
            <p>
              If you are located in the European Economic Area (EEA), you have the right to lodge a
              complaint with your local data protection authority if you believe we have not handled
              your data in accordance with applicable law.
            </p>
          </Section>

          <Section id="children" title="Children's Privacy">
            <p>
              This site is not directed at children under the age of 13 (or 16 in the EEA). We do
              not knowingly collect personal information from children. If you believe a child has
              submitted personal information to us, please contact us at{' '}
              <a href={`mailto:${OWNER_EMAIL}`} className="text-accent hover:underline">
                {OWNER_EMAIL}
              </a>{' '}
              and we will delete it promptly.
            </p>
          </Section>

          <Section id="changes" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              legal requirements, or the services we use. When we make material changes, we will
              update the "effective date" at the top of this page.
            </p>
            <p>
              We encourage you to review this policy periodically. Your continued use of the site
              after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how
              we handle your data, please contact:
            </p>
            <div className="bg-subtle/40 rounded-2xl p-6 mt-4 border border-subtle">
              <p className="font-medium text-ink mb-1">{OWNER_NAME}</p>
              <p className="text-sm text-ink/60 mb-1">Singjamei, Imphal West, Manipur, India</p>
              <a href={`mailto:${OWNER_EMAIL}`} className="text-accent hover:underline text-sm">
                {OWNER_EMAIL}
              </a>
            </div>
            <p className="text-sm mt-4">
              Alternatively, you can reach us through the{' '}
              <Link to="/contact" className="text-accent hover:underline">contact page</Link>.
            </p>
          </Section>

          {/* Footer nav */}
          <div className="border-t border-subtle pt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <p className="text-xs text-ink/40">
              © {new Date().getFullYear()} {SITE_NAME} · {OWNER_NAME}
            </p>
            <div className="flex gap-6 text-xs text-ink/50">
              <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-accent transition-colors">Contact</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
