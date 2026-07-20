/**
 * apps/web/src/app/features/settings/profile/ProfilePublicSettings.tsx
 *
 * Adds to the existing settings sidebar under Profile:
 *   - "Public Profile" toggle (makes theblackout.app/@handle live)
 *   - "FBM Marketplace" connection field
 *   - Copy link to public profile
 *
 * Uses folds components to match existing settings UX exactly.
 * Import this and render it at the bottom of ProfileEditor.tsx
 * or as a new "Public Profile" section in Settings.tsx.
 *
 * Pattern follows: apps/web/src/app/features/settings/general/General.tsx
 */

import { useState, useEffect } from 'react'
import {
  SettingTile,
  Switch,
  Input,
  Button,
  Text,
  Box,
  color,
  toRem,
} from 'folds'
import { useMatrixClient } from '../../../hooks/useMatrixClient'

const HOMESERVER = 'theblackout.app'
const FBM_API    = 'https://api.freeblackmarket.com'

// co.bmc.profile account data type
const PROFILE_EVENT_TYPE = 'co.bmc.profile'

interface BMCProfileData {
  bio?:         string
  pronouns?:    string
  banner?:      string
  public?:      boolean
  connections?: Array<{
    type:      string
    username?: string
    url?:      string
    label?:    string
  }>
}

export function ProfilePublicSettings() {
  const mx = useMatrixClient()
  const userId = mx.getUserId() ?? ''
  const handle = userId.replace(`@`, '').replace(`:${HOMESERVER}`, '')

  const [profileData, setProfileData] = useState<BMCProfileData>({})
  const [isPublic,    setIsPublic]    = useState(false)
  const [fbmHandle,   setFbmHandle]   = useState('')
  const [fbmStatus,   setFbmStatus]   = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [saving,      setSaving]      = useState(false)
  const [copied,      setCopied]      = useState(false)

  const profileUrl = `https://theblackout.app/@${handle}`

  // Load existing co.bmc.profile account data
  useEffect(() => {
    mx.getAccountData(PROFILE_EVENT_TYPE)
      ?.getContent<BMCProfileData>()
      && (function(data: BMCProfileData) {
        setProfileData(data)
        setIsPublic(data.public ?? false)
        const fbmConn = data.connections?.find(c => c.type === 'fbm')
        if (fbmConn?.username) {
          setFbmHandle(fbmConn.username)
          setFbmStatus('valid')
        }
      })(mx.getAccountData(PROFILE_EVENT_TYPE)!.getContent<BMCProfileData>())
  }, [mx])

  // Verify FBM handle exists
  const verifyFBM = async (h: string) => {
    if (!h.trim()) { setFbmStatus('idle'); return }
    setFbmStatus('checking')
    try {
      const r = await fetch(`${FBM_API}/store/vendors/${h.trim()}`)
      setFbmStatus(r.ok ? 'valid' : 'invalid')
    } catch {
      setFbmStatus('invalid')
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      // Merge into existing co.bmc.profile without clobbering other fields
      const existing = mx.getAccountData(PROFILE_EVENT_TYPE)?.getContent<BMCProfileData>() ?? {}

      // Update connections array — preserve non-FBM connections
      const otherConnections = (existing.connections ?? []).filter(c => c.type !== 'fbm')
      const fbmConnection = fbmHandle.trim() && fbmStatus === 'valid'
        ? [{ type: 'fbm', username: fbmHandle.trim(), url: `https://freeblackmarket.com/vendors/${fbmHandle.trim()}` }]
        : []

      const updated: BMCProfileData = {
        ...existing,
        public: isPublic,
        connections: [...otherConnections, ...fbmConnection],
      }

      await mx.setAccountData(PROFILE_EVENT_TYPE, updated)
      setProfileData(updated)
    } catch (err) {
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
    <>
      {/* ── Public Profile Toggle ── */}
      <SettingTile
        title="Public Profile"
        description={
          isPublic
            ? `Your profile is live at theblackout.app/@${handle}`
            : 'Enable to create a public page anyone can visit — no Blackout account needed.'
        }
        after={
          <Switch
            variant="Primary"
            isSelected={isPublic}
            onChange={setIsPublic}
          />
        }
      />

      {/* ── Profile URL + copy ── */}
      {isPublic && (
        <Box direction="Column" gap="200" style={{ padding: `0 ${toRem(16)} ${toRem(8)}` }}>
          <Box direction="Row" gap="200" alignItems="Center">
            <Text
              as="span"
              size="T300"
              style={{
                fontFamily: 'monospace',
                color: color.Primary.Main,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {profileUrl}
            </Text>
            <Button
              variant="Secondary"
              size="300"
              onClick={copyLink}
            >
              {copied ? 'Copied ✓' : 'Copy Link'}
            </Button>
            <Button
              variant="Secondary"
              size="300"
              onClick={() => window.open(profileUrl, '_blank')}
            >
              Open ↗
            </Button>
          </Box>
        </Box>
      )}

      {/* ── FBM Connection ── */}
      <SettingTile
        title="FreeBlackMarket Store"
        description={
          fbmStatus === 'valid'
            ? `Connected to freeblackmarket.com/vendors/${fbmHandle} — your store shows on your public profile.`
            : fbmStatus === 'invalid'
            ? 'Handle not found on FreeBlackMarket — check the spelling.'
            : 'Connect your FBM vendor account to show your events and products on your public profile.'
        }
      />

      <Box direction="Column" gap="200" style={{ padding: `0 ${toRem(16)} ${toRem(16)}` }}>
        <Box direction="Row" gap="200" alignItems="Center">
          <Input
            value={fbmHandle}
            onChange={e => {
              setFbmHandle(e.target.value)
              setFbmStatus('idle')
            }}
            onBlur={() => verifyFBM(fbmHandle)}
            placeholder="your-fbm-handle"
            style={{ flex: 1 }}
            variant={
              fbmStatus === 'valid'   ? 'Success' :
              fbmStatus === 'invalid' ? 'Critical' :
              'Background'
            }
          />
          <Button
            variant="Secondary"
            size="300"
            onClick={() => verifyFBM(fbmHandle)}
            isLoading={fbmStatus === 'checking'}
          >
            Verify
          </Button>
        </Box>
        {fbmStatus === 'valid' && (
          <Text size="T200" style={{ color: color.Success.Main }}>
            ✓ Verified — {fbmHandle} found on FreeBlackMarket
          </Text>
        )}
      </Box>

      {/* ── Save ── */}
      <Box
        direction="Row"
        gap="200"
        justifyContent="End"
        style={{ padding: `${toRem(8)} ${toRem(16)} ${toRem(16)}` }}
      >
        <Button
          variant="Primary"
          onClick={save}
          isLoading={saving}
        >
          Save Public Profile Settings
        </Button>
      </Box>
    </>
  )
}
