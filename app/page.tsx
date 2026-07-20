/**
 * Shakti Innergy homepage.
 *
 * Server component: FBM catalog and Blackout profile are fetched
 * server-side with ISR (revalidate: 300 in the lib clients), so the
 * page is SEO-complete on first byte and stays fresh without rebuilds.
 * Both integrations fail soft — the site renders fully when either
 * API is unreachable.
 */

import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Story } from '@/components/Story'
import { Services } from '@/components/Services'
import { Quote } from '@/components/Quote'
import { Storefront } from '@/components/Storefront'
import { BlackoutConnect } from '@/components/BlackoutConnect'
import { Contact } from '@/components/Contact'
import { Footer } from '@/components/Footer'
import { getVendorCatalog } from '@/lib/fbm'
import { getBlackoutProfile } from '@/lib/blackout'
import { FBM_HANDLE, BLACKOUT_USER_ID } from '@/lib/config'

export default async function HomePage() {
  const [fbm, blackoutProfile] = await Promise.all([
    getVendorCatalog(FBM_HANDLE),
    getBlackoutProfile(BLACKOUT_USER_ID),
  ])

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Story />
        <Services />
        <Quote />
        <Storefront data={fbm} />
        <BlackoutConnect blackoutProfile={blackoutProfile} />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
