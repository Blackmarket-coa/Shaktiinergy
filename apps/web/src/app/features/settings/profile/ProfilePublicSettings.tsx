/**
 * apps/web/src/app/features/settings/profile/ProfilePublicSettings.tsx
 *
 * A settings section that plugs into the existing Profile settings page.
 * Lets a creator:
 *   1. Toggle their public profile on/off  (public: true/false in co.bmc.profile)
 *   2. Connect a FreeBlackMarket vendor handle (verified against the FBM store API)
 *   3. Save — merging into existing co.bmc.profile account data without clobbering
 *      any field this component doesn't own.
 *
 * Layout uses folds components (SettingTile / Switch / Input / Button / Text / Box)
 * and folds design tokens (color / toRem), matching the pattern established in
 * apps/web/src/app/features/settings/general/General.tsx exactly.
 *
 * ── WIRING (Deliverable 4.2) ──────────────────────────────────────────────
 * This component is purely additive. In the existing Profile settings page
 * (e.g. apps/web/src/app/features/settings/profile/Profile.tsx — the page that
 * already renders ProfileEditor), import and render it as the last section so
 * the existing UI is untouched:
 *
 *   import { ProfilePublicSettings } from './ProfilePublicSettings'
 *   ...
 *   // ── existing profile settings (ProfileEditor, etc.) render above ──
 *   <ProfilePublicSettings />
 *
 * If settings sections are grouped in <SettingTile>/<SequenceCard> wrappers on
 * that page, drop <ProfilePublicSettings /> inside the same wrapper the other
 * sections use so spacing stays consistent. No other file needs to change.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import { SettingTile, Switch, Input, Button, Text, Box, color, toRem } from 'folds'
import { useMatrixClient } from '../../../hooks/useMatrixClient'

const HOMESERVER = 'theblackout.app'
const FBM_API = 'https://api.freeblackmarket.com'
const FBM_STORE = 'https://freeblackmarket.com'
const PROFILE_EVENT_TYPE = 'co.bmc.profile'

type FbmStatus = 'idle' | 'checking' | 'valid' | 'invalid'

interface Connection {
  type: string
  username?: string
  url?: string
  label?: string
}

interface BMCProfileData {
  bio?: string
  pronouns?: string
  banner?: string
  decoration?: string
  public?: boolean
  connections?: Connection[]
}

/** Reads current co.bmc.profile account data content (or {} if unset). */
function readProfile(mx: ReturnType<typeof useMatrixClient>): BMCProfileData {
  return mx.getAccountData(PROFILE_EVENT_TYPE)?.getContent<BMCProfileData>() ?? {}
}

export function ProfilePublicSettings() {
  const mx = useMatrixClient()
  const userId = mx.getUserId() ?? ''
  // Strip the "@" prefix and ":homeserver" suffix to recover the bare handle.
  const handle = userId.replace(/^@/, '').replace(`:${HOMESERVER}`, '')
  const profileUrl = `https://${HOMESERVER}/@${handle}`

  const [isPublic, setIsPublic] = useState(false)
  const [fbmHandle, setFbmHandle] = useState('')
  const [fbmStatus, setFbmStatus] = useState<FbmStatus>('idle')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // Hydrate from existing account data once on mount.
  useEffect(() => {
    const data = readProfile(mx)
    setIsPublic(data.public ?? false)
    const fbmConn = data.connections?.find((c) => c.type === 'fbm')
    if (fbmConn?.username) {
      setFbmHandle(fbmConn.username)
      setFbmStatus('valid')
    }
  }, [mx])

  const verifyFBM = async (h: string) => {
    const trimmed = h.trim()
    if (!trimmed) {
      setFbmStatus('idle')
      return
    }
    setFbmStatus('checking')
    try {
      const r = await fetch(`${FBM_API}/store/vendors/${encodeURIComponent(trimmed)}`)
      setFbmStatus(r.ok ? 'valid' : 'invalid')
    } catch {
      setFbmStatus('invalid')
    }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      // Merge: preserve every existing field, only touch `public` and the fbm
      // entry inside connections[]. Non-fbm connections are kept verbatim.
      const existing = readProfile(mx)
      const trimmed = fbmHandle.trim()

      const otherConnections = (existing.connections ?? []).filter((c) => c.type !== 'fbm')
      const fbmConnection: Connection[] =
        trimmed && fbmStatus === 'valid'
          ? [{ type: 'fbm', username: trimmed, url: `${FBM_STORE}/vendors/${trimmed}` }]
          : []

      const updated: BMCProfileData = {
        ...existing,
        public: isPublic,
        connections: [...otherConnections, ...fbmConnection],
      }

      await mx.setAccountData(PROFILE_EVENT_TYPE, updated)
      setSaved(true)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProfilePublicSettings] save failed', err)
    } finally {
      setSaving(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Box direction="Column" gap="400">
      {/* ── 1. Public Profile toggle ── */}
      <SettingTile
        title="Public Profile"
        description={
          isPublic
            ? `Your profile is live at ${HOMESERVER}/@${handle}`
            : 'Enable to create a public page anyone can visit — no Blackout account needed.'
        }
        after={<Switch variant="Primary" value={isPublic} onChange={setIsPublic} />}
      >
        {isPublic && (
          <Box direction="Row" gap="200" alignItems="Center">
            <Box grow="Yes">
              <Text
                as="span"
                size="T300"
                truncate
                style={{ fontFamily: 'monospace', color: color.Primary.Main }}
              >
                {profileUrl}
              </Text>
            </Box>
            <Button variant="Secondary" size="300" onClick={copyLink}>
              <Text as="span" size="B300">
                {copied ? 'Copied' : 'Copy Link'}
              </Text>
            </Button>
            <Button
              variant="Secondary"
              size="300"
              onClick={() => window.open(profileUrl, '_blank', 'noopener')}
            >
              <Text as="span" size="B300">
                Open
              </Text>
            </Button>
          </Box>
        )}
      </SettingTile>

      {/* ── 2. FreeBlackMarket store connection ── */}
      <SettingTile
        title="FreeBlackMarket Store"
        description={
          fbmStatus === 'valid'
            ? `Connected — your store shows on your public profile.`
            : fbmStatus === 'invalid'
              ? 'Handle not found on FreeBlackMarket — check the spelling.'
              : 'Connect your FBM vendor handle to show your events and products.'
        }
      >
        <Box direction="Column" gap="200">
          <Box direction="Row" gap="200" alignItems="Center">
            <Box grow="Yes">
              <Input
                value={fbmHandle}
                onChange={(e) => {
                  setFbmHandle(e.currentTarget.value)
                  setFbmStatus('idle')
                }}
                onBlur={() => verifyFBM(fbmHandle)}
                placeholder="your-fbm-handle"
                variant={
                  fbmStatus === 'valid'
                    ? 'Success'
                    : fbmStatus === 'invalid'
                      ? 'Critical'
                      : 'Background'
                }
              />
            </Box>
            <Button
              variant="Secondary"
              size="400"
              onClick={() => verifyFBM(fbmHandle)}
              disabled={fbmStatus === 'checking'}
            >
              <Text as="span" size="B300">
                {fbmStatus === 'checking' ? 'Checking…' : 'Verify'}
              </Text>
            </Button>
          </Box>
          {fbmStatus === 'valid' && (
            <Text size="T200" style={{ color: color.Success.Main }}>
              Verified — {fbmHandle} found on FreeBlackMarket
            </Text>
          )}
          {fbmStatus === 'invalid' && (
            <Text size="T200" style={{ color: color.Critical.Main }}>
              Could not find {fbmHandle} on FreeBlackMarket
            </Text>
          )}
        </Box>
      </SettingTile>

      {/* ── 3. Save ── */}
      <Box direction="Row" gap="200" alignItems="Center" justifyContent="End">
        {saved && (
          <Text size="T200" style={{ color: color.Success.Main }}>
            Saved
          </Text>
        )}
        <Button variant="Primary" onClick={save} disabled={saving}>
          <Text as="span" size="B400">
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Button>
      </Box>
    </Box>
  )
}

export default ProfilePublicSettings
