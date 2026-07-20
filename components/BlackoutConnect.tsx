/**
 * "Message on Blackout" band. Pulls the live Blackout profile (bio /
 * pronouns) when Malinda's co.bmc.profile is public, and always offers
 * the direct-message deep link — visitors don't need an account to see
 * the page, only to message.
 */

import { type BlackoutProfile, type MatrixProfile, messageLink } from '@/lib/blackout'
import { BLACKOUT_USER_ID } from '@/lib/config'

interface Props {
  matrixProfile: MatrixProfile | null
  blackoutProfile: BlackoutProfile | null
}

export function BlackoutConnect({ matrixProfile, blackoutProfile }: Props) {
  const name = matrixProfile?.displayname ?? 'Malinda'
  return (
    <section className="section" id="connect">
      <div className="container">
        <div className="blackout-band">
          <div>
            <h3>Connect with {name} on Blackout</h3>
            <p>
              {blackoutProfile?.bio ??
                'Private, encrypted conversation on the Blackout network — reach out about coaching, speaking, or events.'}
            </p>
            <div className="mono">{BLACKOUT_USER_ID}</div>
          </div>
          <a
            className="btn btn-teal"
            href={messageLink(BLACKOUT_USER_ID)}
            target="_blank"
            rel="noreferrer"
          >
            Message on Blackout
          </a>
        </div>
      </div>
    </section>
  )
}
